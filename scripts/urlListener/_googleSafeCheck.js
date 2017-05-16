'use strict';
const _ = require('lodash');
const config = require('../../config');
const logger = require('../../lib/logger');
const safe = require('../generators/_getGoogleSafeUrlCheck');

module.exports = results => new Promise(resolve => {
    // No Google API Key available for safe check
    if (_.isUndefined(config.apiKeys.google) || !_.isString(config.apiKeys.google) || _.isEmpty(config.apiKeys.google))
        return resolve(results);

    return safe(results.url)
        .then(safeCheck => {
            // Nothing to see here
            if (!safeCheck.length) return resolve(results);

            // Iterate over the results
            _.each(safeCheck, result => {
                // Not enough information to provide a line
                if (!result.threatType || !result.platformType || !result.threat.url) return;
                // Push it into the cache
                results.threats.push({
                    type: result.threatType,
                    platform: result.platformType
                });
            });
            resolve(results);
        })
        .catch(err => {
            logger.warn('Error in URL Chain Safe Check', {
                err
            });
            resolve(results);
        });
});
