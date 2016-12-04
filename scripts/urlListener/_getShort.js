'use strict';
const _ = require('lodash');
const isgd = require('../generators/_isGdShortUrl');
const google = require('../generators/_googleShortUrl');
const config = require('../../config');
const logger = require('../../lib/logger');

module.exports = results => new Promise(resolve => {
    let outputs = [];
    // We have a google API key, push google to the shorten providers
    if (!_.isUndefined(config.apiKeys.google) && _.isString(config.apiKeys.google) && !_.isEmpty(config.apiKeys.google)) outputs.push(google);
    // We do not have a google API key, use isgd as the shorten service
    else outputs.push(isgd);
    // Grab one generator, and use it to resolve the short url
    _.sample(outputs)(results.url)
        .then(url => resolve(_.merge(results, {
            shortUrl: url
        })))
        .catch(err => {
            logger.warn('Error in URL Shortner function', {
                err
            });
            resolve(results);
        });
});
