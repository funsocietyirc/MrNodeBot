'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const HashMap = require('hashmap');
const scheduler = require('../../lib/scheduler');
const conLogger = require('../../lib/consoleLogger');
const apiKey = require('../../config').apiKeys.google;

// Cache URLS to prevent unnecessary API calls
const urlCache = new HashMap();

// Time to run the clear schedule
const cronTime = '00 01 * * *';

// Clear cache every hour
scheduler.schedule('cleanUrls', cronTime, () => {
    conLogger('Clearing Google Short URL Cache', 'info');
    urlCache.clear();
});

module.exports = (results) => {
    // Check input / Gate
    if (_.isEmpty(apiKey) || results.url.startsWith('http://goo.gl/') || results.url.startsWith('https://goo.gl/')) {
        return results;
    }

    // Short URL already exists in cache
    if (urlCache.has(results.url)) {
        return _.merge(results, {
            shortUrl: urlCache.get(results.url)
        });
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
            urlCache.set(results.url, result.id);
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
