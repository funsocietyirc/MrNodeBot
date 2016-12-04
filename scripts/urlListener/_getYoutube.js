'use strict';

const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');

module.exports = (key, results) => new Promise(resolve => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

    return gen(apiKey, key)
        .then(result => {
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) return resolve(results);
            // Set youtube data on results object
            results.youTube = {
                videoTitle: data.snippet.title,
                viewCount: data.statistics.viewCount,
                likeCount: data.statistics.likeCount,
                dislikeCount: data.statistics.dislikeCount,
                commentCount: data.statistics.commentCount
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
