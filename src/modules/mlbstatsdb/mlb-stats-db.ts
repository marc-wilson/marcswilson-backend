import * as fs from 'fs-extra';

export class MlbStatsDb {
    public socket: any = null;
    constructor(private _socket: any){
        this.socket = _socket;
        this.socket.on('updateDatabase', this.init.bind(this));
    }
    init(): void {
        let num = 0;
        const interval = setInterval( () => {
            if (num < 100) {
                num += 1;
                this.socket.emit('progress', { progress: num });
            } else {
                clearInterval(interval);
            }
        }, 500);
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