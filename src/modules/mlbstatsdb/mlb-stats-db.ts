import * as fs from 'fs-extra';
import * as download from 'download-git-repo';
import * as MongoClient from 'mongodb/lib/mongo_client';
import { environment } from '../../../environment';
import * as csv from 'csvtojson';

export class MlbStatsDb {
    public socket: any = null;
    constructor(private _socket: any){
        this.socket = _socket;
        this.socket.on('updateDatabase', this.init.bind(this));
    }
    async init(): Promise<void> {
        let errorOccurred = false;

        this.socket.emit('progress', { progress: `Step 1/12: Removing BaseballDatabank local repo` });
        const removeDBStep = await this.removeDatabankRepo();
        errorOccurred = removeDBStep === true ? false : removeDBStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Error removing databank repo`});
        } else {
            this.socket.emit('progress', { progress: `Step 1/12: Finished removing BaseballDatabank local repo`})
        }

        this.socket.emit('progress', { progress: `Step 2/12: Cloning baseball databank repo`});
        try {
            this.socket.emit('progress', { progress: `Step 2/12: About to clone repo`});
            const cloneRepoStep = await this.cloneRepository();
            this.socket.emit('progress', { progress: `Step 2/12: done cloning baseball databank repo`});
            errorOccurred = cloneRepoStep === true ? false : cloneRepoStep;
            if ( errorOccurred ) {
                this.socket.emit( 'progress', { progress: `Step 2/12: Failed - Error cloning baseball databank` } )
            } else {
                this.socket.emit( 'progress', { progress: `Step 2/12: Finished cloning baseball databank` } )
            }
        } catch(ex) {
            this.socket.emit( 'progress', { progress: ex.message });
        }

        this.socket.emit('progress', { progress: `Step 3/12: Dropping mlbstatsdb`});
        const dropDBStep = await this.dropDatabase();
        errorOccurred = dropDBStep === true ? false : dropDBStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Step 3/12: Failed - Error droping mlbstatsdb`});
        } else {
            this.socket.emit('progress', { progress: `Step 3/12: mlbstatsdb has been dropped`});
        }

        this.socket.emit('progress', { progress: `Step 4/12: Creating database`});
        const createDBStep = await this.createDatabase();
        this.socket.emit('progress', { progress: `after createdbstep ${createDBStep}`});
        errorOccurred = createDBStep === true ? false : createDBStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Step 4/12: Failed - Error creating database`});
        } else {
            this.socket.emit('progress', { progress: null });
        }


    }
    async removeDatabankRepo(): Promise<any> {
        this.socket.emit('progress', { progress: 'removeDatabankRepo entered' });
        return new Promise( (resolve, reject) => {
            this.socket.emit('progress', { progress: 'About to Remove baseballdatabank' });
            fs.remove('baseballdatabank', err => {
                this.socket.emit('progress', { progress: 'fs remove finished' });
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            })
        });
    }
    async cloneRepository(): Promise<any> {
        return new Promise( (resolve, reject) => {
            this.removeDatabankRepo().then( res => {
                if (res) {
                    try {
                        download('chadwickbureau/baseballdatabank', 'baseballdatabank', (err) => {
                            if (!err) {
                                resolve(true);
                            } else {
                                reject(err);
                            }
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                } else {
                    reject(null);
                }
            });
        });
    }
    async dropDatabase(): Promise<any> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${environment.DATABASE.CONNECTION_STRING}/mlbstatsdb`, (err, _db) => {
                if (err) {
                    reject(err);
                } else {
                    _db.dropDatabase({}, (dropErr, result) => {
                        if (dropErr) {
                            reject(dropErr);
                            _db.close();
                        } else {
                            resolve(true);
                            _db.close();
                        }
                    });
                }
            })
        });
    }
    async createDatabase(): Promise<any> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${environment.DATABASE.CONNECTION_STRING}`, (err, client) => {
                if (!err) {
                    const db = client.db( 'mlbstatsdb' );
                    this.getCsvFiles().then( files => {
                        const promises = files.map( async f => {
                            const name = this.getCollectionNameFromFile(f);
                            if (name) {
                                return await this.createCollection(name, f);
                            }
                        });
                        Promise.all(promises).then( results => {
                            this.socket.emit('progress', { progress: `All promises completed: ${results.length}`});
                            resolve(true);
                        }).catch( error => {
                            this.socket.emit('progress', { progress: `uuuuuh ${error.message}`});
                            reject(error);
                        });

                    }, error => {
                        reject( error );
                    } );
                } else {
                    reject(err);
                }
            });
        });
    }
    async createCollection(collectionName: string, fileName: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${environment.DATABASE.CONNECTION_STRING}`, (err, client) => {
                if (!err) {
                    const db = client.db('mlbstatsdb');
                    const data = [];
                    this.socket.emit('progress', { progress: `creating ${collectionName} collection`});
                    db.createCollection(collectionName, (colError, result) => {
                        if (!colError) {
                            // TODO: CSV to JSON here...
                            const csvPath = `baseballdatabank/core/${fileName}`;
                            csv().fromFile(csvPath).on('json', (jsonObj) => {
                               if (jsonObj) {
                                   data.push(jsonObj);
                               } else {
                                   reject(true);
                               }
                            }).on('done', error => {
                                this.socket.emit('progress', { progress: `csv process complete for ${collectionName}. record count: ${data.length}`});
                                if (error) {
                                    this.socket.emit('progress', { progress: `Something bad happened!!!!!`});
                                    reject(error);
                                } else {
                                    const collection = db.collection(collectionName);
                                    const batch = collection.initializeOrderedBulkOp();
                                    for (let i = 0; i < data.length; i++) {
                                        batch.insert(data[i]);
                                    }
                                    this.socket.emit('progress', { progress: `batch command about to execute ${collectionName}`});
                                    batch.execute( (bulkError, bulkResult) => {
                                        if (bulkError) {
                                            this.socket.emit('progress', { progress: `Bulk Error!`});
                                            reject(bulkError);
                                        } else {
                                            this.socket.emit('progress', { progress: `Bulk process done for ${collectionName}`});
                                            resolve(bulkResult);
                                        }
                                    });
                                }
                            });
                        } else {
                            reject(colError);
                        }
                    });
                } else {
                    reject(err);
                }
            });
        });
    }
    getCollectionNameFromFile(fileName: string): string {
        let name = '';
        if (fileName.endsWith('.csv')) {
            fileName = fileName.replace('.csv', '');
            name = fileName.endsWith('s') ? fileName.toLowerCase() : `${fileName.toLowerCase()}s`;
            return name;
        }
        return null;
    }
    getCsvFiles(): Promise<any> {
        const files = [];
        return new Promise( (resolve, reject) => {
            fs.readdir('baseballdatabank/core', (err, _files) => {
                if (!err) {
                    for (let i = 0; i < _files.length; i++) {
                        files.push(_files[i]);
                    }
                    resolve(files);
                } else {
                    reject(err);
                }
            })
        });
    }
}