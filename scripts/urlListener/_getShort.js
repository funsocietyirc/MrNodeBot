'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google;


module.exports = (results) => {
    // Check input / Gate
    if (results.unreachable || !apiKey || _.isEmpty(apiKey)) {
        return results;
    }

    results.isShort = _.includes(results.url, '://goo.gl/');


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
            if (!result || !result.id || (result.isShort && !result.longUrl)) {
                return results;
            }

            return _.merge(results, {
                shortUrl: results.isShort ? result.longUrl : result.id
            })
        })
        .catch(err => {
            console.log('Error in Google Shortner');
            console.dir(err);
            return results;
        });

};
