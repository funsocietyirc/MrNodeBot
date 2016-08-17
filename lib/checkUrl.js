// Verify a URL is still good
const urlExists = require('url-exists');
const consoleLogger = require('./consoleLogger');

module.exports = function(Url, callback) {
    urlExists(Url, (err, exists) => {
        if (err) {
            consoleLogger(err, 'error');
            callback(true);
        }
        callback(exists);
    })
};
