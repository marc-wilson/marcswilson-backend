import * as MlbStatsApi from './mlb-stats-api';
import * as PowerballAPI from './powerball-api';
import * as AuthAPI from './auth-api';
import * as EmailAPI from './email-api';

class Server {
    private _express: any = null;
    private _app: any = null;
    private _bodyParser: any = null;
    private _path: any = null;
    private _server: any = null;
    private _cors: any = null;
    public dotenv: any = require('dotenv').config({ path: './server.env'});
    constructor() {
        this._cors = require('cors');
        this._express = require('express');
        this._app = this._express();
        this._bodyParser = require('body-parser');
        this._path = require('path');
        this._server = require('http').createServer(this._app);
        this._app.listen(process.env.PORT || 3000);
        this._app.use(this._bodyParser.urlencoded({extended: true}));
        this._app.use(this._bodyParser.json());
        this._app.use(this._express.static(this._path.join(__dirname + './')));
        this._app.use(this._cors());
        this._app.use('/mlbstats', MlbStatsApi);
        this._app.use('/powerball', PowerballAPI);
        this._app.use('/auth', AuthAPI);
        this._app.use('/email', EmailAPI);

    }
}

new Server();