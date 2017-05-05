'use strict';
const _ = require('lodash');
const short = require('../lib/_getShortService');
const logger = require('../../lib/logger');

module.exports = async results => {
  try {
    let shortUrl = await short(results.url);
    Object.assign(results, {
      shortUrl: shortUrl
    });
  } catch (err) {
    logger.warn('Error in URL Shortner function', {
      err
    });
  } finally {
    return results;
  }
};
