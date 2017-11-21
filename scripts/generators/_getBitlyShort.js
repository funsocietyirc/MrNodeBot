const _ = require('lodash');
const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.bitly || '';
const logger = require('../../lib/logger');

module.exports = async (url) => {
    try {
        const results = await rp({
            uri: 'https://api-ssl.bitly.com/v3/shorten',
            method: 'GET',
            json: true,
            qs: {
                access_token: apiKey,
                longUrl: url,
            },
        });

        return !_.isEmpty(results.data.url) ? results.data.url : '';
    } catch (err) {
        logger.error('Error in the _getBitlyShort generator', {
            message: err.message || '',
            stack: err.stack || '',
        });

        throw err;
    }
};
