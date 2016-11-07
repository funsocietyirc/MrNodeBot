'use strict';
const _ = require('lodash');
const google = require('../generators/_googleShortUrl');
const isgd = require('../generators/_isGdShortUrl');
const apiKey = require('../../config').apiKeys.google;

module.exports = results => !apiKey || _.isEmpty(apiKey) ? results :
    _.sample([isgd])(results.url)
    .then(url => _.merge(results, {
        shortUrl: url
    }))
    .catch(err => {
        console.log('Error in Google Shortner');
        console.dir(err);
        return results;
    });
