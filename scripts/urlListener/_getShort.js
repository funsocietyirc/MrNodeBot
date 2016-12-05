'use strict';
const _ = require('lodash');
const short = require('../lib/_getShortService');
const logger = require('../../lib/logger');

module.exports = results => new Promise(resolve => short(results.url)
    .then(url => resolve(_.merge(results, {
        shortUrl: url
    })))
    .catch(err => {
        logger.warn('Error in URL Shortner function', {
            err
        });
        resolve(results);
    }));
