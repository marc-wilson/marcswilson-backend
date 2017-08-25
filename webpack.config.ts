
module.exports = {
    plugins: [
    ],
    entry: './src/server.js',
    output: {
        path: __dirname + '/dist',
        filename: 'servers.js'
    },
    target: 'node'
}