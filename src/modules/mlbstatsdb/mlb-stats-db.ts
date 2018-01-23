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
    init(): void {
        this.socket.emit('progress', { progress: `Step 1/12: Removing BaseballDatabank local repo` });
        this.removeDatabankRepo().then( _result => {
            this.socket.emit('progress', { progress: `Step 1/12: Finished removing BaseballDatabank local repo`})
        }, error => {
            this.socket.emit('progress', { progress: `Error removing databank repo`});
        }).then( () => {
            this.socket.emit('progress', { progress: `Step 2/12: Cloning baseball databank repo`})
            this.cloneRepository().then( _result => {
                this.socket.emit('progress', { progress: `Step 2/12: Finished cloning baseball databank`})
            }, error => {
                this.socket.emit('progress', { progress: `Step 2/12: Failed - Error cloning baseball databank`})
            });
        }).then( () => {
            this.socket.emit('progress', { progress: `Step 3/12: Droping mlbstatsdb`});
            this.dropDatabase().then( _result => {
                this.socket.emit('progress', { progress: `Step 3/12: mlbstatsdb has been dropped`});
            }, error => {
                this.socket.emit('progress', { progress: `Step 3/12: Failed - Error dropding mlbstatsdb`});
            });
        }).then( () => {
            this.socket.emit('progress', { progress: `Step 4/12: Creating database`});
            this.createDatabase().then( _result => {
                this.socket.emit('progress', { progress: `${_result.join(', ')}`});
            }, error => {
                this.socket.emit('progress', { progress: `Step 4/12: Failed - Error creating database`});
            });
        })
    }
    removeDatabankRepo(): Promise<any> {
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
    cloneRepository(): Promise<any> {
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
    dropDatabase(): Promise<any> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${environment.DATABASE.CONNECTION_STRING}/mlbstatsdb`, (err, _db) => {
                if (err) {
                    reject(err);
                } else {
                    _db.dropDatabase().then( (dropErr, result) => {
                        if (dropErr) {
                            reject(dropErr);
                        } else {
                            resolve(true);
                        }
                    });
                }
            })
        });
    }
    createDatabase(): Promise<any> {
        return new Promise( (resolve, reject) => {
            this.getCsvFiles().then( files => {
                resolve(files);
            }, error => {
                reject(error);
            });
        });
    }
    getCsvFiles(): Promise<any> {
        const files = [];
        return new Promise( (resolve, reject) => {
            fs.readdir('baseballdatabank/core', (err, files) => {
                if (!err) {
                    for (let i = 0; i < files.length; i++) {
                        files.push(files[i]);
                    }
                    resolve(files);
                } else {
                    reject(err);
                }
            })
        });
    }
}