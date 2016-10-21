'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google;


module.exports = (results) => {
    // Check input / Gate
    if (_.isEmpty(apiKey) || results.url.startsWith('http://goo.gl/') || results.url.startsWith('https://goo.gl/')) {
        return results;
    }

    // Get the SHORT Url
    return rp({
            uri: `https://www.googleapis.com/urlshortener/v1/url`,
            method: 'POST',
            json: true,
            qs: {
              key: apiKey
            },
            body: {
                "longUrl": results.url
            }
        })
        .then(result => {
            if (!result || !result.id) {
                return results;
            }
            return _.merge(results, {
                shortUrl: result.id
            })
        })
        .catch(err => {
            console.log('Error in Google Shortner');
            console.dir(err);
            return results;
        });

};
