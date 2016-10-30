'use strict';
const config = require('../../config');
const conLogger = require('../../lib/consoleLogger');
const resultsCache = require('./_resultsCacheStore');
module.exports = (results) => {

  // Cache results
  resultsCache.set(results.url, results);

  // If we are in debug mode, echo request to console
  if(config.bot.debug == true) {
    conLogger('URL Link chain completed');
    console.dir(results);
  }

  return results;
};
