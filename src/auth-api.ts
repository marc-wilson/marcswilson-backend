
import { environment } from '../environment';
import * as CryptoJS from 'crypto-js';
import { User } from './models/admin/user';

export class AuthApi {
    public express: any = null;
    public request: any = null;
    public router: any = null;
    private _mongoClient = require('mongodb').MongoClient;
    private readonly _CONNECTION_STRING: string = environment.DATABASE.CONNECTION_STRING;

    constructor() {
        this.express = require('express');
        this.request = require('request');
        this.router = this.express.Router();

        this.router.post('/login', (request, response) => {
            this.login(request.body.username, request.body.hash).then( _result => {
                response.status(200).json(_result);
            }, error => {
                response.status(500).json(error);
            })
        })

        module.exports = this.router;
    }
    login(username: string, hash: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongoClient.connect(this._CONNECTION_STRING, (_connectionError, _client) => {
                if (_connectionError) {
                    _client.close();
                    reject(_connectionError);
                } else {
                    const collection = _client.db('admin').collection('users');
                    collection.find( { email: username }).toArray( (_err, _docs) => {
                       if (_err) {
                           reject(_err);
                       } else {
                           const record = new User(_docs[0]);
                           if (record) {
                               const auth = this.doesHashMatch(record.passwordHash);
                               console.log(auth);
                           } else {
                               reject(new Error ('Something strange happened that I have not accounted for'));
                               // TODO: Insert exception notifier here (airbrake, insights, email, slack, etc...)
                           }
                           resolve(_docs);
                       }
                    });
                }
            });
        });
    }
    doesHashMatch(hash: string): boolean {
        const dec = CryptoJS.AES.decrypt(hash, environment.SECURITY.SERVER_KEY);
        return true;
    }
}
new AuthApi();
