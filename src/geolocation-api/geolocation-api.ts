
export class GeoLocationApi {
    public express = null;
    public request = null;
    public router = null;
    public cities = null;
    constructor() {
        this.express = require('express');
        this.request = require('request');
        this.cities = require('cities');
        this.request = require('request-promise-native');
        this.router = this.express.Router();

        this.router.get('/city/:city/state/:state', (request, response) => {
            const ret = this.cities.findByCityAndState(request.params.city, request.params.state);
            response.json(ret);
        });
        this.router.get('/topojson/us', async (request, response) => {
            const topo = await this.getUSTopoJson();
            response.status(200).json(topo);
        })

        module.exports = this.router;
    }
    async getUSTopoJson(): Promise<any> {
        const topojson = await this.request.get('https://bl.ocks.org/mbostock/raw/4090846/us.json');
        return JSON.parse(topojson);
    }

}

new GeoLocationApi();