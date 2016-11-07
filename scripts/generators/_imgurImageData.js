'use strict'

// https://api.imgur.com/models/image

const rp = require('request-promise-native');
const config = require('../../config');

module.exports = key => new Promise((resolve, reject) => {
  let clientId = config.apiKeys.imgur.clientId;

  // We have no API key
  if (!clientId) {
    reject(new Error('A API key is required'));
    return;
  }

  // We have no key
  if(!key) {
    reject(new Error('A key is required'));
    return;
  }
  return rp({
    uri: `https://api.imgur.com/3/image/${key}`,
    method: 'GET',
    json: true,
    headers: {
      'Authorization': `Client-ID ${clientId}`
    }
  })
  .then(results => {
    if(!results.success || results.status != 200 || !results.data) {
      resolve(new Error('Something went wrong fetching the results'));
      return;
    }
    resolve(results.data);
  });
});
