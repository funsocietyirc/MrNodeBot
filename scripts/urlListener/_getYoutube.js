'use strict';
const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');
const pusherApi = require('../../lib/pusher');


module.exports = (key, results) => new Promise(resolve => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

    const numberOrNa = number => !isNaN(number) ? number : 0;

    return gen(apiKey, key)
        .then(result => {
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) return resolve(results);
            // Set youtube data on results object
            results.youTube = {
                key: key,
                videoTitle: data.snippet.title,
                viewCount: numberOrNa(data.statistics.viewCount),
                likeCount: numberOrNa(data.statistics.likeCount),
                dislikeCount: numberOrNa(data.statistics.dislikeCount),
                commentCount: numberOrNa(data.statistics.commentCount)
            };
            // Fire off youtube data
            if (pusherApi) {
              console.dir(psuherApi);
                let pusherVars = {
                    to: results.to,
                    from: results.from,
                    timestamp: results.timestamp,
                    videoTitle: results.youTube.videoTitle,
                    youtubeKey: results.youTube.key,
                    url: results.url
                };
                console.dir(pusherVars);

                pusherApi.trigger('public', 'youtube', pusherVars);
            }

            resolve(results);
        })
        .catch(err => {
            logger.warn('Error in YouTube link function', {
                err
            });
            resolve(results);
        });

});
