const _ = require('lodash');
const rp = require('request-promise-native');
const config = require('../../config');

module.exports = (type, key, results) =>  {
  let clientId = config.apiKeys.imgur.clientId;

  // We have no API key
  if (!clientId || !key || !type) return results;

  return rp({
    uri: `https://api.imgur.com/3/${type}/${key}`,
    method: 'GET',
    json: true,
    headers: {
      'Authorization': `Client-ID ${clientId}`
    }
  })
  .then(data => {
    console.dir(data);
    if(!data.success || data.status != 200 || !data.data) return results;
    results.imgur = data.data;
    results.imgur.matchType = type;
    return results;
  });

}
