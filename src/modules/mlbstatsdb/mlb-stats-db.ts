import * as fs from 'fs-extra';
import * as download from 'download-git-repo';

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
}