"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MlbStatsApi = require("./mlb-stats-api");
var PowerballAPI = require("./powerball-api");
var AuthAPI = require("./auth-api");
var EmailAPI = require("./email-api");
var TimeTrackerAPI = require("./time-tracker-api");
var Server = (function () {
    function Server() {
        this._express = null;
        this._app = null;
        this._bodyParser = null;
        this._path = null;
        this._server = null;
        this._cors = null;
        this._cors = require('cors');
        this._express = require('express');
        this._app = this._express();
        this._bodyParser = require('body-parser');
        this._path = require('path');
        this._server = require('http').createServer(this._app);
        this._app.listen(process.env.PORT || 3000);
        this._app.use(this._bodyParser.urlencoded({ extended: true }));
        this._app.use(this._bodyParser.json());
        this._app.use(this._express.static(this._path.join(__dirname + './')));
        this._app.use(this._cors());
        this._app.use('/api/mlbstats', MlbStatsApi);
        this._app.use('/api/powerball', PowerballAPI);
        this._app.use('/api/auth', AuthAPI);
        this._app.use('/api/email', EmailAPI);
        this._app.use('/api/timetracker', TimeTrackerAPI);
    }
    return Server;
}());
new Server();
//# sourceMappingURL=server.js.map