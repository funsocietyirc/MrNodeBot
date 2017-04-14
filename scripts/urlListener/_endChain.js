'use strict';
const config = require('../../config');
const logger = require('../../lib/logger');
const resultsCache = require('../../lib/hashedCacheStore');
const pusherApi = require('../../lib/pusher');

module.exports = results => {
    // Fire off youtube data
    if (
        pusherApi &&
        results.youTube &&
        results.youTube.youTube.key
    ) {
        let pusherVars = {
            to: results.to,
            from: results.from,
            timestamp: results.timestamp,
            videoTitle: results.youTube.videoTitle,
            youtubeKey: results.youTube.key,
            url: results.url
        };
        pusherApi.trigger('public', 'youtube', pusherVars);
    }

    // Cache results
    resultsCache.set(results.url, results);
    // If we are in debug mode, echo request to console
    if (config.bot.debug == true) logger.log('URL Link chain completed', {
        results
    });
    return results;
};
