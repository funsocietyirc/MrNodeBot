'use strict';
const _ = require('lodash');

module.exports = (app, results) => new Promise(resolve => {
  // Bail if we do not have socketio
  if (!app.WebServer.socketIO) return resolve(results);

  // Assure the feature is enabled
  const watchYoutubeEnabled =
    app.WebServer.socketIO && // We Have socketIO
    !_.isEmpty(app.Config.features.watchYoutube) &&
    app.Config.features.watchYoutube; // The Feature is enabled

  // Decide which socketio channel to push over
  let channel = /\.(gif|jpg|jpeg|tiff|png)$/i.test(results.url) ? 'image' : 'url';

  // Grab a timestamp
  let timestamp = Date.now();

  // Prepare Output
  let output = {
    url: results.url,
    to: results.to,
    from: results.from,
    timestamp: timestamp,
    title: results.title || '',
    threat: _.isEmpty(results.threats)
  };

  // Include an ID if we have one
  if (results.id) output.id = results.id;
  // Include a ShortUrl if we have one
  if (results.shortUrl) output.shortUrl = results.shortUrl;

  // Set output to socketio
  app.WebServer.socketIO.emit(channel, output);

  // Append results
  results.delivered.push({
    protocol: 'socketio',
    channel: channel,
    on: timestamp
  });

  // Trigger a update on the youtube channel if we have a youtube link
  // Fire off youtube data
  if (
    watchYoutubeEnabled &&
    !_.isEmpty(results.youTube) && // We Have youtube data
    !_.isEmpty(results.youTube.video) && // We have a video key
    !results.youTube.video.restrictions && // We do not have georestrictions
    results.youTube.video.embeddable // The video is embeddable
  ) app.WebServer.socketIO.of('/youtube').to(`/${results.to.toLowerCase()}`).emit('message', Object.assign(results.youTube, {
    to: results.to,
    from: results.from,
    timestamp: timestamp,
    seekTime: results.youTube.seekTime || 0,
  }));

  resolve(results);
});
