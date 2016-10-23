'use strict'
/**
  Get a response from the Is Good URl Shortner
  Input:
    text - URL to shorten
  Returns:
    shorturl - The Good Url short link
**/
const rp = require('request-promise-native');

module.exports = text => rp({
  uri: `https://is.gd/create.php`,
  method: 'GET',
  json: true,
  qs: {
    format: 'json',
    url: text
  }
});
