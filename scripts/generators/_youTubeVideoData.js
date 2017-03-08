'use strict';
const endPoint = 'https://www.googleapis.com/youtube/v3/videos';
const rp = require('request-promise-native');
module.exports = (apiKey, key) => rp({
    uri: endPoint,
    qs: {
        key: apiKey,
        id: key,
        fields: 'items(id,snippet(channelId,title,categoryId),statistics)',
        part: 'snippet,statistics'
    },
    json: true
});
