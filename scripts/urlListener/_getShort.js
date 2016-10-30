'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google;

module.exports = results => !apiKey || _.isEmpty(apiKey) ? results :
    rp({
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
        if (!result || !result.id) return results;

        return _.merge(results, {
            shortUrl: results.isShort ? result.longUrl : result.id
        })
    })
    .catch(err => {
        console.log('Error in Google Shortner');
        console.dir(err);
        return results;
    });
