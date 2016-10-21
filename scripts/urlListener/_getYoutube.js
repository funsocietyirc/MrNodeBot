'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const getTitle = require('./_getTitle');
const apiKey = require('../../config').apiKeys.google;

module.exports = (key, results) => {
    // Bail if we have no result
    if (!apiKey || !key || _.isEmpty(key)) {
        return getTitle(results);
    }
    return rp({
            uri: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
                id: key,
                key: apiKey,
                fields: 'items(id,snippet(channelId,title,categoryId),statistics)',
                part: 'snippet,statistics'
            },
            json: true
        })
        .then(result => {
            let data = result.items[0];
            // We have no data, default back to the original title grabber
            if (!data) {
                return getTitle(results.url, results)
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
