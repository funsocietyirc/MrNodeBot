const _ = require('lodash');
const rp = require('request-promise-native');
const config = require('../../config');
const logger = require('../../lib/logger');

module.exports = (type, key, results) => new Promise((resolve, reject) => {
    const clientId = config.apiKeys.imgur.clientId;
    // We have no API key
    if (!clientId || !key || !type) return reject(new Error('Something went wrong'));

    return rp({
        uri: `https://api.imgur.com/3/${type}/${key}`,
        method: 'GET',
        json: true,
        headers: {
            Authorization: `Client-ID ${clientId}`,
        },
    })
        .then((data) => {
            if (!data.success || data.status !== 200 || !data.data) return reject(new Error('Problem with result'));
            results.imgur = data.data;
            results.imgur.matchType = type;
            resolve(results);
        });
})
    .catch((err) => {
        logger.warn('Error in Imgur link function', {
            message: err.message || '',
            stack: err.stack || '',
        });
        return results;
    });
