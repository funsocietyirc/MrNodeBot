'use strict';
// Return the google shortner service if the api key is available, otherwise default to isGd
// The Reason for this, although isGd does not require an api key, it blocks a lot of vpn services
// from using it
const _ = require('lodash');
const config = require('../../config');

const isGd = require('../generators/_isGdShortUrl');
const google = require('../generators/_googleShortUrl');

module.exports = domain => {

  // default
  const defaultShort = !_.isUndefined(config.apiKeys.google) && _.isString(config.apiKeys.google) && !_.isEmpty(config.apiKeys.google)
    ? google
    : isGd;

  // No Domain provided
  if (_.isEmpty(domain))
    return defaultShort;

  // Domain Exceptions
  switch (domain) {
    case 'dropboxusercontent.com':
      return isGd;
    default:
      return defaultShort
  }
};
