'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google;


module.exports = (results) => {
    // Check input / Gate
    if (!apiKey || _.isEmpty(apiKey)) {
        return results;
    }

    results.isShort = _.includes(results.url, '://goo.gl/');

    let rpOption = !results.isShort ? {
      uri: `https://www.googleapis.com/urlshortener/v1/url`,
      method: 'POST',
      json: true,
      qs: {
        key: apiKey
      },
      body: {
          "longUrl": results.url
      }
    } : {
      method: 'GET',
      json: true,
      uri: 'https://www.googleapis.com/urlshortener/v1/url',
      qs: {
        key: apiKey,
        shortUrl: results.url
      }
    };

    // Get the SHORT Url
    return rp(rpOption)
        .then(result => {
            if (!result || !result.id || (result.isShort && !result.longUrl)) {
                return results;
            }
            if(results.isShort) {
              results.url = results.longUrl;
            }
            return _.merge(results, {
                shortUrl: results.isShort ? result.longUrl: result.id
            })
        })
        .catch(err => {
            console.log('Error in Google Shortner');
            console.dir(err);
            return results;
        });

};
