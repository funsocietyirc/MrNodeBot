'use strict';
const _ = require('lodash');
const gen = require('../generators/_googleShortUrl');
const gen2 = require('../generators/_isGdShortUrl');
const apiKey = require('../../config').apiKeys.google;

module.exports = results => !apiKey || _.isEmpty(apiKey) ? results :
    _.sample([gen,gen2])(results.url)
    .then(url => _.merge(results, {
        shortUrl: url
    }))
    .catch(err => {
        console.log('Error in Google Shortner');
        console.dir(err);
        return results;
    });
