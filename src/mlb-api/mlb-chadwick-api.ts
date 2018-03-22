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
        this.router.get('/teams/:yearID', async (request, response) => {
            const teams = await this.getTeams(request.params.yearID);
            response.status(200).json(teams);
        });
        this.router.get('/teams/:yearID/:teamID', async (request, response) => {
            const team = await this.getTeam(request.params.yearID, request.params.teamID);
            response.status(200).json(team);
        });
        this.router.get('/ballparks', async (request, response) => {
            const ballparks = await this.getBallparks();
            response.status(200).json(ballparks);
        });
        module.exports = this.router;
    }
    async getSeasons() {
        const docs = await this.db.distinct('teams', 'yearID', {});
        return docs;
    }
    async getTeams(yearID: string) {
        const docs = await this.db.find('teams', { yearID: yearID });
        return docs;
    }
    async getTeam(yearID: string, teamID: string) {
        const docs = await this.db.find('teams', { yearID: yearID, teamID: teamID });
        return docs;
    }
    async getBallparks() {
        const docs = await this.db.find('parks', {});
        return docs;
    }
}

new MlbChadwickApi();