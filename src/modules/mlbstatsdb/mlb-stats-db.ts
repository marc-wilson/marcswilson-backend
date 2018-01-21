import * as fs from 'fs-extra';

export class MlbStatsDb {
    constructor(){}
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