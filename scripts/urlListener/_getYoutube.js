'use strict';

const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;

// get metadata from YouTube -- Requires a api key
module.exports = (key, results) => !apiKey || !key || _.isEmpty(key) ? results :
    gen(apiKey, key)
    .then(result => {
        let data = result.items[0];

        // We have no data, default back to the original title grabber
        if (!data) return results;

        // Set youtube data on results object
        results.youTube = {
            videoTitle: data.snippet.title,
            viewCount: data.statistics.viewCount,
            likeCount: data.statistics.likeCount,
            dislikeCount: data.statistics.dislikeCount,
            commentCount: data.statistics.commentCount
        };
        return results;
    })
    .catch(err => {
        console.log('Youtube API Link Error');
        console.dir(err);
        return results;
    });
