import * as webpack from 'webpack';

module.exports = {
    plugins: [
        new webpack.IgnorePlugin(/vertx/)
    ],
    entry: './src/server.js',
    output: {
        path: __dirname + '/dist',
        filename: 'server.js'
    },
    target: 'node'
}