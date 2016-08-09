// Verify a URL is still good
const urlExists = require('url-exists');
module.exports = function(Url, callback) {
    urlExists(Url, (err, exists) => {
        if (err) {
            console.log(err);
            callback(true);
        }
        callback(exists);
    })
};
