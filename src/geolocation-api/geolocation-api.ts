
export class GeoLocationApi {
    public express = null;
    public request = null;
    public router = null;
    public cities = null;
    constructor() {
        this.express = require('express');
        this.request = require('request');
        this.cities = require('cities');
        this.router = this.express.Router();

        this.router.get('/city/:city/state/:state', (request, response) => {
            const ret = this.cities.findByCityAndState(request.params.city, request.params.state);
            response.json(ret);
        });

        module.exports = this.router;
    }

}

new GeoLocationApi();