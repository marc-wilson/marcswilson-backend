import { environment } from '../environment';
import { MongoClient } from 'mongodb';
import { Database } from './models/admin/database';
import { Collection } from './models/admin/collection';
import { User } from './models/admin/user';

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
        this.router.get('/databases/:databaseName/collections', (request, response) => {
            this.listCollections(request.params.databaseName).then( _collections => {
                response.status(200).json(_collections);
            }, error => {
                response.status(500).json(error);
            })
        });
        this.router.get('/databases/:databaseName/:collectionName', (request, response) => {
            this.getCollectionData(request.params.databaseName, request.params.collectionName).then( data => {
                response.status(200).json(data);
            }, error => {
                response.status(500).json(error);
            });
        });
        this.router.post('/databases/create/:databaseName', (request, response) => {
            const name = request.params.databaseName;
            this.createDatabase(name).then( _db => {
                response.status(200).json(_db);
            }, error => {
                response.status(500).json(error);
            });
        });

        this.router.post('/users/create', (request, response) => {
            const user = new User();
            user.name = request.body.name;
            user.email = request.body.email;
            user.role = request.body.role;
            user.created = request.body.created;

           this.createUser(user).then( _users => {
               response.status(200).json(_users);
           }, error => {
               response.status(500).json(error);
           })
        });
        this.router.get('/users', (request, response) => {
            this.getUsers().then( _users => {
                response.status(200).json(_users);
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
    getCollectionData(databaseName: string, collectionName: string): Promise<any[]> {
        return new Promise( (resolve, reject) => {
           MongoClient.connect(`${this.CONNECTION_STRING}`, (err, _client) => {
               if (!err) {
                   const db = _client.db(databaseName);
                   const collection = db.collection(collectionName);
                   collection.find().limit(100).toArray( (_err, docs) => {
                       if (!_err) {
                           resolve(docs);
                       } else {
                           reject(_err);
                       }
                   });
               } else {
                   reject(err);
               }
           });
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
    createUser(user: User): Promise<User[]> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(`${this.CONNECTION_STRING}`, (connectionErr, _client) => {
                if (connectionErr) {
                    _client.close();
                    reject(connectionErr);
                } else {
                    const collection = _client.db('admin').collection('users');
                    collection.insertOne(user, (_err, _result) => {
                        if (!_err) {
                            _client.close();
                            this.getUsers().then( _users => {
                                resolve( _users );
                            }, error => {
                                reject( error );
                            } );
                        } else {
                            reject(_err);
                            _client.close();
                        }
                    });
                }
            })
        });
    }
    getUsers(): Promise<User[]> {
        return new Promise( (resolve, reject) => {
            MongoClient.connect(this.CONNECTION_STRING, (connectionError, _client) => {
                if (connectionError) {
                    reject(connectionError);
                    _client.close();
                } else {
                    const collection = _client.db('admin').collection('users');
                    collection.find().toArray( (err, docs) => {
                        if (err) {
                            reject(err);
                            _client.close();
                        } else {
                            const users = docs.map( u => new User(u) );
                            resolve(users);
                            _client.close();
                        }
                    });
                }
            })
        })
    }
}

new AdminApi();
