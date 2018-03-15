import { Database } from '../models/database';

export class MlbChadwickApi {
    public express = null;
    public request = null;
    public router = null;
    public db: Database = null;
    constructor() {
        this.express = require('express');
        this.request = require('request');
        this.router = this.express.Router();
        this.db = new Database('mlbstats');
        this.router.get('/seasons', async (request, response) => {
            const seasons = await this.getSeasons();

        });

        module.exports = this.router;
    }
    async getSeasons() {
        this.db.distinct('players', {});
    }
    async test() {
        const t = await this.db.connect();
        return t;
    }
}

new MlbChadwickApi();