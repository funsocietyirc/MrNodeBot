const config = require('../../config');
const logger = require('../../lib/logger');
const resultsCache = require('./_urlCacheStore');

module.exports = (results) => {
    // Cache results
    resultsCache.set(results.url, results);
    // If we are in debug mode, echo request to console
    if (config.bot.debug === true) {
        logger.debug('URL Link chain completed', {
            results,
        });
    }
    return results;
};
