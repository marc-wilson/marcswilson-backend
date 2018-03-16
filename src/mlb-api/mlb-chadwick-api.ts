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
        this.db = new Database('mlbstatsdb');

        this.router.get('/seasons', async (request, response) => {
            const seasons = await this.getSeasons();
            response.status(200).json(seasons);
        });

        module.exports = this.router;
    }
    async getSeasons() {
        const docs = await this.db.distinct('teams', 'yearID', {});
        return docs;
    }
}

new MlbChadwickApi();