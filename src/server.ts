import * as MlbStatsApi from './mlb-stats-api';
import * as PowerballAPI from './powerball-api';
import * as AuthAPI from './auth-api';
import * as EmailAPI from './email-api';
import * as AdminApi from './admin-api';
import * as webSocket from 'socket.io';

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
        //this._server = require('http').createServer(this._app);
        this._server = this._app.listen(process.env.PORT || 3000);
        this._app.use(this._bodyParser.urlencoded({extended: true}));
        this._app.use(this._bodyParser.json());
        this._app.use(this._express.static(this._path.join(__dirname + './')));
        this._app.use(this._cors());
        this._app.use('/mlbstats', MlbStatsApi);
        this._app.use('/powerball', PowerballAPI);
        this._app.use('/auth', AuthAPI);
        this._app.use('/email', EmailAPI);
        this._app.use('/admin', AdminApi);

        this._io = webSocket.listen(this._server);
        const connections = [];
        this._io.on('connection', (socket) => {
            console.log('socket connected');
            connections.push(socket);
            console.log('connections: ' + connections.length);
            socket.on('disconnect', () => {
                console.log('socket disconnected');
                connections.pop();
                console.log('connections: ' + connections.length);
            });
        });
        console.log(`server listening on ${process.env.PORT || 3000}`);

    }
}

new Server();