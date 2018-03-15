import { environment } from '../../environment';
import { Collection } from 'mongodb';

export class Database {
    public mongoClient = require('mongodb').MongoClient;
    public DB_PATH = environment.DATABASE.CONNECTION_STRING;

    constructor(private _databaseName: string) {
        this.DB_PATH = `${this.DB_PATH}/${this._databaseName}`;

    }

    async connect(): Promise<Collection> {
        return new Promise<Collection>( (resolve, reject) => {
            this.mongoClient.connect(this.DB_PATH, (_err, _client) => {
                if (_err) {
                    reject(_err);
                } else {
                    resolve(_client);
                }
            });
        });

    }
    async disconnect() {

    }
    async distinct(collectionName: string, key: string, query: any) {
        const client: any = await this.connect();
        const collection = client.collection(collectionName);
    }

}