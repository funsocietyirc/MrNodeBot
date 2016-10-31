'use strict';
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google || '';

module.exports = url =>  rp({
      uri: `https://www.googleapis.com/urlshortener/v1/url`,
      method: 'POST',
      json: true,
      qs: {
          key: apiKey
      },
      body: {
          "longUrl": url
      }
  })
  .then(results => results.id || '');
