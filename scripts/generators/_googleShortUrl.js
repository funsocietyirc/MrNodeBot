const rp = require('request-promise-native');
const apiKey = require('../../config').apiKeys.google || '';
const logger = require('../../lib/logger');

module.exports = async (url) => {
    try {
        const results = await rp({
            uri: 'https://www.googleapis.com/urlshortener/v1/url',
            method: 'POST',
            json: true,
            qs: {
                key: apiKey,
            },
            body: {
                longUrl: url,
            },
        });

        return results.id || '';
    } catch (err) {
        if (err.statusCode && err.statusCode === 400) return;

        // We have a short url, just bail
        logger.error('Something went wrong in the _googleShortUrl generator', {
            message: err.message || '',
            stack: err.stack || '',
        });

        throw err;
    }
};

