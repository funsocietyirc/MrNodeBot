'use strict';
const _ = require('lodash');
const isgd = require('../generators/_isGdShortUrl');
const google = require('../generators/_googleShortUrl');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');

module.exports = results => !apiKey || _.isEmpty(apiKey) ? results :
    _.sample([google])(results.url)
    .then(url => _.merge(results, {
        shortUrl: url
    }))
    .catch(err => {
        logger.error('Error in URL Shortner function', {err});
        return results;
    });
