const _ = require('lodash');
const config = require('../../config');
const logger = require('../../lib/logger');
const safe = require('../generators/_getGoogleSafeUrlCheck');

const googleSafeCheck = async (results) => {
    // No Google API Key available for safe check
    if (_.isUndefined(config.apiKeys.google) || !_.isString(config.apiKeys.google) || _.isEmpty(config.apiKeys.google)) { return results; }

    try {
        const safeCheck = await safe(results.url);

        // Nothing to see here
        if (!safeCheck.length) return results;

        // Iterate over the results
        _.each(safeCheck, (result) => {
            // Not enough information to provide a line
            if (!result.threatType || !result.platformType || !result.threat.url) return;
            // Push it into the cache
            results.threats.push({
                type: result.threatType,
                platform: result.platformType,
            });
        });

        return results;
    } catch (err) {
        logger.warn('Error in URL Chain Safe Check', {
            message: err.message || '',
            stack: err.stack || '',
        });
        return results;
    }
};

module.exports = googleSafeCheck;
