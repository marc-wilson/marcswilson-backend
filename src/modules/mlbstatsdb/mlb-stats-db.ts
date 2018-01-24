import * as fs from 'fs-extra';
import * as download from 'download-git-repo';
import * as MongoClient from 'mongodb/lib/mongo_client';
import { environment } from '../../../environment';

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

        this.socket.emit('progress', { progress: `Step 2/12: Cloning baseball databank repo`})
        const cloneRepoStep = await this.cloneRepository();
        errorOccurred = cloneRepoStep === true ? false : cloneRepoStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Step 2/12: Failed - Error cloning baseball databank`})
        } else {
            this.socket.emit('progress', { progress: `Step 2/12: Finished cloning baseball databank`})
        }

        this.socket.emit('progress', { progress: `Step 3/12: Droping mlbstatsdb`});
        const dropDBStep = await this.dropDatabase();
        errorOccurred = dropDBStep === true ? false : dropDBStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Step 3/12: Failed - Error droping mlbstatsdb`});
        } else {
            this.socket.emit('progress', { progress: `Step 3/12: mlbstatsdb has been dropped`});
        }

        this.socket.emit('progress', { progress: `Step 4/12: Creating database`});
        const createDBStep = await this.createDatabase();
        errorOccurred = createDBStep === true ? false : createDBStep;
        if (errorOccurred) {
            this.socket.emit('progress', { progress: `Step 4/12: Failed - Error creating database`});
        } else {
            this.socket.emit('progress', { progress: `Finished`});
        }


    }
    async removeDatabankRepo(): Promise<any> {
        return new Promise( (resolve, reject) => {
            fs.remove('baseballdatabank', err => {
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
                    download('chadwickbureau/baseballdatabank', 'baseballdatabank', (err) => {
                        if (!err) {
                            resolve(true);
                        } else {
                            reject(err);
                        }
                    })
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

                        const promises = files.map( f => {
                            const name = this.getCollectionNameFromFile(f);
                            if (name) {
                                return this.createCollection(name);
                            }
                        });
                        Promise.all(promises).then( results => {
                            resolve(true);
                        }).catch( error => {
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
    async createCollection(collectionName: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${environment.DATABASE.CONNECTION_STRING}`, (err, client) => {
                if (!err) {
                    const db = client.db('mlbstatsdb');
                    db.createCollection(collectionName, (colError, result) => {
                        if (!colError) {
                            resolve(true);
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