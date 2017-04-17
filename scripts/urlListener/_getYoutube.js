'use strict';
const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const apiKey = require('../../config').apiKeys.google;
const logger = require('../../lib/logger');


module.exports = (key, list, index, seekTime, results) => new Promise(resolve => {
  // No Key provided, return the results
  if (
    (!_.isString(key) || _.isEmpty(key)) &&
    (!_.isString(list) || _.isEmpty(list))
  ) return resolve(results);

  // Normalize Helper
  const numberOrZero = number => !isNaN(number) ? number : 0;

  return gen(apiKey, key, list)
    .then(result => {
      // We have no data, default back to the original title grabber
      if (!result) return resolve(results);
      // Initialize youtube results
      results.youTube = {};

      // Current Video Index
      if(_.isNumber(index)) results.youTube.index = index;
      // Video Seek Time
      if(_.isNumber(seekTime)) results.youTube.seekTime = seekTime;

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
          videoCount: numberOrZero(result.playlistResults.contentDetails.itemCount),
          playlistTitle: result.playlistResults.snippet.title || ''
        };

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
