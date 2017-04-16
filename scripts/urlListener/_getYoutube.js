'use strict';
const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');

module.exports = (key, list, results) => new Promise(resolve => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

    const numberOrZero = number => !isNaN(number) ? number : 0;

    return gen(apiKey, key, list)
        .then(result => {
            console.dir(result);
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) return resolve(results);

            // Set youtube data on results object
            results.youTube = {
                key: key,
                videoTitle: data.snippet.title || '',
                viewCount: numberOrZero(data.statistics.itemCount),
                likeCount: numberOrZero(data.statistics.likeCount),
                dislikeCount: numberOrZero(data.statistics.dislikeCount),
                commentCount: numberOrZero(data.statistics.commentCount),
                channelTitle: data.snippet.channelTitle || '',
            };

            // Playlist
            if(list != null) {
                results.youTube.playlist = list;
                //results.youTube.videoCount = numberOrZero(data.contentDetails.itemCount);
            }

            resolve(results);
        })
        .catch(err => {
            logger.warn('Error in YouTube link function', {
                err: err.stack,
            });
            resolve(results);
        });

});
