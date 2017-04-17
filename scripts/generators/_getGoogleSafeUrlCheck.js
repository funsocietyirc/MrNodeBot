'use strict';
const endPoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find`;
const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const config = require('../../config');

module.exports = url => new Promise((resolve, reject) => {
  if (_.isUndefined(config.apiKeys.google) || !_.isString(config.apiKeys.google) || _.isEmpty(config.apiKeys.google))
    return reject(new Error('Url required for safe check'));

  if (_.isUndefined(url) || (!_.isString(url) && !_.isArray(url)) || _.isEmpty(url))
    return reject(new Error('Url required for safe check'));

  // Setup the entries
  let threatEntries = [];
  if (_.isArray(url))
    _.each(url, suburl => threatEntries.push({
      url: suburl
    }));
  else threatEntries.push({
    url
  });

  return rp({
      uri: endPoint,
      method: 'POST',
      json: true,
      qs: {
        key: config.apiKeys.google
      },
      body: {
        client: {
          clientId: 'MrNodeBot',
          clientVersion: '1'
        },
        threatInfo: {
          threatTypes: ['THREAT_TYPE_UNSPECIFIED', 'MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ALL_PLATFORMS'],
          threatEntryTypes: ['URL'],
          threatEntries
        }
      }
    })
    .then(results => resolve(results.matches || {}))
    .catch(err => {
      logger.error('Error in Google URL Safe check Generator', {
        err
      });
      reject(new Error('Error Resolving safe check'));
    });
});
