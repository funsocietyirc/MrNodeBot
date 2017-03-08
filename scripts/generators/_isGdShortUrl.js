'use strict'
  // Get a response from the Is Good URl Shortner
  // Input:
  //   text - URL to shorten
  // Returns:
  //   shorturl - The Good Url short link
const endPoint = `https://is.gd/create.php`; 
const rp = require('request-promise-native');

module.exports = text => rp({
  uri: endPoint,
  method: 'GET',
  json: true,
  qs: {
    format: 'json',
    url: text
  }
})
.then(results => results.shorturl || '');
