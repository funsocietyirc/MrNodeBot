'use strict';

const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google || '';
const logger = require('../../lib/logger');

module.exports = async (url) => {
    try {
        const results = await rp({
            uri: `https://www.googleapis.com/urlshortener/v1/url`,
            method: 'POST',
            json: true,
            qs: {
                key: apiKey
            },
            body: {
                "longUrl": url
            }
        });

        return results.id || '';
    }
    catch (err) {
        logger.error('Something went wrong in the _googleShortUrl generator', {
            message: err.message || '',
            stack: err.stack || '',
        });

        throw err;
    }
};

