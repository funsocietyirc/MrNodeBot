'use strict';

const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const getTitle = require('./_getTitle');

module.exports = (key, results) => {
    // Bail if we have no result
    if (!apiKey || !key || _.isEmpty(key)) {
        return getTitle(results);
    }
    return gen(apiKey, key)
        .then(result => {
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) {
                return getTitle(results)
            }
            let videoTitle = data.snippet.title;
            let viewCount = data.statistics.viewCount;
            let likeCount = data.statistics.likeCount;
            let dislikeCount = data.statistics.dislikeCount;
            let commentCount = data.statistics.commentCount;
            return _.merge(results, {
                youTube: {
                    videoTitle,
                    viewCount,
                    likeCount,
                    dislikeCount,
                    commentCount
                }
            });
        })
        .catch(err => {
            console.log('Youtube API Link Error');
            console.dir(err);
            return getTitle(results);
        });
};
