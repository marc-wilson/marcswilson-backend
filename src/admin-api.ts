import { environment } from '../environment';
import { Db, MongoClient } from 'mongodb';

export class AdminApi {
    public express: any = null;
    public router: any = null;
    public mongodb: MongoClient = null;

    constructor() {
        this.express = require('express');
        this.router = this.express.Router();
        this.mongodb = require('mongodb').MongoClient;

        this.router.get('/databases', (request, response) => {
            this.listDatabases().then( _databases => {
                response.status(200).json(_databases);
            }, error => {
                response.status(500).json(error);
            });
        });

        module.exports = this.router;
    }

    connect(): Promise<any> {
        return new Promise( (resolve, reject) => {
           MongoClient.connect(environment.DATABASE.CONNECTION_STRING, (err, _db) => {
               if (err) {
                   reject(err);
               } else {
                   resolve(_db);
               }
           });
        });
    }
    listDatabases(): Promise<any[]> {
        return new Promise( (resolve, reject) => {
           this.connect().then( _db => {
               _db.admin().listDatabases().then( _databases => {
                   resolve(_databases.databases);
               }, error => {
                   reject(error);
               });
           }, error => {
               reject(error);
           });
        });
    }
}

new AdminApi();
