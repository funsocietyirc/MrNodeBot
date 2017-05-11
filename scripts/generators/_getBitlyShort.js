'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.bitly || '';

module.exports = url => rp({
  uri: `https://api-ssl.bitly.com/v3/shorten`,
  method: 'GET',
  json: true,
  qs: {
    access_token: apiKey,
    longUrl: url
  }
}).then(results => !_.isEmpty(results.data.url) ? results.data.url : '');
