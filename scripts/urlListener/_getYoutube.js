'use strict';
const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');

module.exports = (key, list, results) => new Promise(resolve => {
  // No Key provided, return the results
  if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

  // Normalize Helper
  const numberOrZero = number => !isNaN(number) ? number : 0;

  return gen(apiKey, key, list)
    .then(result => {
      // We have no data, default back to the original title grabber
      if (!result) return resolve(results);

      // Initialize youtube results
      results.youTube = {};

      // We have Video Results
      if (!_.isEmpty(result.videoResults))
        results.youTube.video = {
          key: key,
          videoTitle: result.videoResults.snippet.title || '',
          viewCount: numberOrZero(result.videoResults.statistics.viewCount),
          likeCount: numberOrZero(result.videoResults.statistics.likeCount),
          dislikeCount: numberOrZero(result.videoResults.statistics.dislikeCount),
          commentCount: numberOrZero(result.videoResults.statistics.commentCount),
          channelTitle: result.videoResults.snippet.channelTitle || '',
        };

      // We have Playlist Results
      if (!_.isEmpty(result.playlistResults))
        results.youTube.playlist = {
          key: list,
          videoCount: numberOrZero(result.playlistResults.contentDetails.itemCount)
        };

        console.dir(results.youTube.video)
      // Return results
      resolve(results);
    })
    .catch(err => {
      logger.warn('Error in YouTube link function', {
        err: err.stack,
      });
      resolve(results);
    });

});
