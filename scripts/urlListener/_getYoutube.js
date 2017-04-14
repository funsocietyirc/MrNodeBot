'use strict';
const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');

module.exports = (key, results) => new Promise(resolve => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

    const numberOrZero = number => !isNaN(number) ? number : 0;

    return gen(apiKey, key)
        .then(result => {
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) return resolve(results);
            // Set youtube data on results object
            results.youTube = {
                key: key,
                videoTitle: data.snippet.title,
                viewCount: numberOrZero(data.statistics.viewCount),
                likeCount: numberOrZero(data.statistics.likeCount),
                dislikeCount: numberOrZero(data.statistics.dislikeCount),
                commentCount: numberOrZero(data.statistics.commentCount)
            };

            resolve(results);
        })
        .catch(err => {
            logger.warn('Error in YouTube link function', {
                err
            });
            resolve(results);
        });

});
