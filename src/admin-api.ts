import { environment } from '../environment';
import { MongoClient } from 'mongodb';
import { Database } from './models/admin/database';
import { Collection } from './models/admin/collection';
//import { MlbStatsDb } from './modules/mlbstatsdb/mlb-stats-db';

export class AdminApi {
    public express: any = null;
    public router: any = null;
    public mongodb: MongoClient = null;
    private readonly CONNECTION_STRING: string = environment.DATABASE.CONNECTION_STRING;

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
        this.router.get('/test', (request, response) => {
           response.status(200).json({testing: 123}) ;
        });
        this.router.get('/databases/:databaseName/collections', (request, response) => {
            this.listCollections(request.params.databaseName).then( _collections => {
                response.status(200).json(_collections);
            }, error => {
                response.status(500).json(error);
            })
        });
        this.router.post('/databases/:databaseName/update', (request, response) => {
            if (request.params.databaseName === 'mlbstatsdb') {
                this.updateMlbStatsDb().then( _result => {
                    response.status(200).json(_result);
                }, error => {
                    response.status(500).json(error);
                });
            } else {
                response.status(501).json(new Error('Not yet implemented'));
            }
        });
        this.router.post('/databases/create/:databaseName', (request, response) => {
            const name = request.params.databaseName;
            this.createDatabase(name).then( _db => {
                response.status(200).json(_db);
            }, error => {
                response.status(500).json(error);
            });
        });
        module.exports = this.router;
    }
    connect(databaseName?: string): Promise<any> {
        const connectionString = databaseName ? `${this.CONNECTION_STRING}/${databaseName}` : this.CONNECTION_STRING;
        return new Promise( (resolve, reject) => {
           MongoClient.connect(connectionString, (err, _client) => {
               if (err) {
                   reject(err);
               } else {
                   resolve(_client);
               }
           });
        });
    }
    listDatabases(): Promise<Database[]> {
        return new Promise( (resolve, reject) => {
           this.connect().then( _db => {
               _db.admin().listDatabases().then( _databases => {
                   const dbs = _databases.databases.map( d => new Database(d) );
                   resolve(dbs);
               }, error => {
                   reject(error);
               });
           }, error => {
               reject(error);
           });
        });
    }
    listCollections(databaseName: string): Promise<Collection> {
        return new Promise( (resolve, reject) => {
            this.connect(databaseName).then( _db => {
                _db.listCollections().toArray( (err, collections) => {
                    if (err) {
                        reject(err);
                    } else {
                        const cols = collections.map( c => new Collection(c) );
                        resolve(cols);
                    }
                });
            }, error => {
                reject(error);
            });
        });
    }
    updateMlbStatsDb(): Promise<any> {
        return new Promise( (resolve, reject) => {
            // const mlbStatsDb = new MlbStatsDb();
            // resolve({test: mlbStatsDb.init()});
        });
    }
    createDatabase(databaseName: string): Promise<any> {
        return new Promise( (resolve, reject) => {
           this.connect().then( _client => {
               const db = _client.db(databaseName);
               db.createCollection(`collection1`, (err, res) => {
                   if (!err) {
                       resolve(true);
                   } else {
                       reject(err);
                       db.close();
                   }
               });
           }, error => {
               reject(error);
           });
        });
    }
}

new AdminApi();
