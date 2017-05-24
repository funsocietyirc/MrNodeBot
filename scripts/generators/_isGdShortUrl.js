'use strict';
// Get a response from the Is Good URl Shortener
// Input:
//   text - URL to shorten
// Returns:
//   shorturl - The Good Url short link
const logger = require('../../lib/logger');
const rp = require('request-promise-native');

const endPoint = `https://is.gd/create.php`;

module.exports = async (text) => {
    try {
        const results = await rp({
            uri: endPoint,
            method: 'GET',
            json: true,
            qs: {
                format: 'json',
                url: text
            }
        });

        return results.shortUrl || '';

    } catch (err) {
        logger.error('Error in the _.isGdShortUrl generator', {
            message: err.message || '',
            stack: err.stack || ''
        });

        throw err;
    }
};
