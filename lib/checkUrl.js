// Verify a URL is still good
module.exports = function (Url, callback) {
    var http = require('http'),
        url = require('url');
    var options = {
        method: 'HEAD',
        host: url.parse(Url).host,
        port: 80,
        path: url.parse(Url).pathname
    };
    var req = http.request(options, function (r) {
        callback( r.statusCode== 200);});
    req.end();
};
