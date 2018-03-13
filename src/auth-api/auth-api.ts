import { environment } from '../../environment';
import * as CryptoJS from 'crypto-js';
import { User } from '../models/admin/user';

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
                response.status(500).json(new Error('Invalid username or password.'));
            })
        });

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
                           if (_docs.length > 0) {
                               const user = new User( _docs[ 0 ] );
                               if ( user ) {
                                   const auth = this.doesHashMatch( hash, user.passwordHash.toString() );
                                   if ( auth === true ) {
                                       resolve( user )
                                   } else {
                                       reject( new Error( 'Invalid Credentials' ) );
                                   }
                               } else {
                                   reject( new Error( 'Something strange happened that I have not accounted for' ) );
                                   // TODO: Insert exception notifier here (airbrake, insights, email, slack, etc...)
                               }
                           } else {
                               new Error('Invalid Credentials');
                           }
                       }
                    })
                }
            });
        });
    }
    doesHashMatch(clientHash: string, serverHash: string): boolean {
        const cpBytes = CryptoJS.AES.decrypt(clientHash, environment.SECURITY.CLIENT_KEY);
        const cPass = cpBytes.toString(CryptoJS.enc.Utf8);
        const spBytes = CryptoJS.AES.decrypt(serverHash, environment.SECURITY.SERVER_KEY);
        const sPassEncrypted = spBytes.toString(CryptoJS.enc.Utf8);
        const sPassEncryptedBytes = CryptoJS.AES.decrypt(sPassEncrypted, environment.SECURITY.CLIENT_KEY);
        const sPass = sPassEncryptedBytes.toString(CryptoJS.enc.Utf8);
        if (cPass === sPass) {
            return true;
        }
        return false;
    }
}
new AuthApi();
