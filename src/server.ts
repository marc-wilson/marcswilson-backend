import * as MlbStatsApi from './mlb-api/mlb-stats-api';
import * as PowerballAPI from './powerball-api/powerball-api';
import * as AuthAPI from './auth-api/auth-api';
import * as EmailAPI from './email-api/email-api';
import * as AdminApi from './admin-api/admin-api';
import * as MlbChadwickApi from './mlb-api/mlb-chadwick-api';
import * as GeoLocationApi from './geolocation-api/geolocation-api';
import { MlbStatsDb } from './modules/mlbstatsdb/mlb-stats-db';


class Server {

    private _express: any = null;
    private _app: any = null;
    private _bodyParser: any = null;
    private _path: any = null;
    private _server: any = null;
    private _cors: any = null;
    private _io: any = null;

    constructor() {
        this._cors = require('cors');
        this._express = require('express');
        this._app = this._express();
        this._bodyParser = require('body-parser');
        this._path = require('path');
        this._server = require('http').createServer(this._app);
        this._io = require('socket.io')(this._server, { serveClient: false });
        this._server.listen(process.env.PORT || 3000);
        this._app.use(this._bodyParser.urlencoded({extended: true}));
        this._app.use(this._bodyParser.json());
        this._app.use(this._express.static(this._path.join(__dirname + './')));
        this._app.use(this._cors());
        this._app.use('/mlbstats', MlbStatsApi);
        this._app.use('/powerball', PowerballAPI);
        this._app.use('/auth', AuthAPI);
        this._app.use('/email', EmailAPI);
        this._app.use('/admin', AdminApi);
        this._app.use('/chadwick', MlbChadwickApi);
        this._app.use('/geolocation', GeoLocationApi);
        const connections = [];
        this._io.on('connection', (socket) => {
            connections.push(socket);
            socket.broadcast.emit('connectionCount', { connections: connections.length });
            socket.emit('connectionCount', { connections: connections.length });
            if (true) { // TODO: Should wrap some kind of permission check around this before loading up the module
                const dbMod = new MlbStatsDb( socket );
            }
            socket.on('disconnect', () => {
                connections.pop();
                socket.broadcast.emit('connectionCount', { connections: connections.length });
            });
        });

        console.log(`server listening on ${process.env.PORT || 3000}`);

    }
}

new Server();