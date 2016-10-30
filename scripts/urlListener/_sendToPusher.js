'use strict';

const _ = require('lodash');
const pusher = require('../../lib/pusher');
module.exports = (results) => {
    // Bail if we have no pusher or the result was unreachable
    if (!pusher || results.unreachable) {
      return results;
    }
    // Decide which pusher channel to push over
    let channel = /\.(gif|jpg|jpeg|tiff|png)$/i.test(results.url) ? 'image' : 'url';
    // Grab a timestamp
    let timestamp = Date.now();
    // Prepare Output
    let output = {
        url: results.url,
        to: results.to,
        from: results.from,
        timestamp,
        // If this is a youtube video, use the vide title rather then the title
        // TODO Update
        title: (!_.isUndefined(results.youTube) && results.youTube.videoTitle) ? results.youTube.videoTitle : results.title || ''
    };
    // Include an ID if we have one
    if (results.id) {
        output.id = results.id;
    }
    // Include a ShortUrl if we have one
    if (results.shortUrl) {
        output.shortUrl = results.shortUrl;
    }

    // Set output to Pusher
    pusher.trigger('public', channel, output);

    // Append results
    results.delivered.push({
        protocol: 'pusher',
        to: channel,
        on: timestamp
    });

    return results;
};
