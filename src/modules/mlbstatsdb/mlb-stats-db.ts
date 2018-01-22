import * as fs from 'fs-extra';

export class MlbStatsDb {
    public socket: any = null;
    constructor(private _socket: any){
        this.socket = _socket;
        this.socket.on('testing', (data) => {
            this.socket.emit('test', { test: data.test});
        })
    }
    init(): void {

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
}