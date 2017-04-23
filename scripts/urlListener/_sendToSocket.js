'use strict';
const _ = require('lodash');

module.exports = (app, results) => new Promise(resolve => {
  // Bail if we do not have socketio
  if (!app.WebServer.socketIO) return resolve(results);

  // Decide which socketio channel to push over
  let channel = /\.(gif|jpg|jpeg|tiff|png)$/i.test(results.url) ? 'image' : 'url';

  // Grab a timestamp
  let timestamp = Date.now();

  // Prepare Output
  let output = {
    url: results.url,
    to: results.to,
    from: results.from,
    timestamp,
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
    app.WebServer.socketIO &&
    !_.isEmpty(results.youTube) &&
    !_.isEmpty(results.youTube.video) &&
    _.isEmpty(results.youTube.playlist)
  ) app.WebServer.socketIO.of('/youtube').emit('message', Object.assign(results.youTube, {
    to: results.to,
    from: results.from,
    timestamp: timestamp,
    index: results.youTube.index || 0,
    seekTime: results.youTube.seekTime || 0,
    hrtime: process.hrtime(),
  }));

  resolve(results);
});
