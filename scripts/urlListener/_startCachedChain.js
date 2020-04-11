const _ = require('lodash');
const resultsCache = require('./_urlCacheStore');
const startChain = require('./_startChain');

module.exports = (url, to, from, text, message, is) => new Promise((resolve, reject) => {
    // Validate required fields
    if (!url || !to || !from || !text || !message) {
        return reject({
            message: 'You are missing a required argument',
        });
    }

    // Check Cache
    if (!resultsCache.has(url)) return resolve(startChain(url, to, from, text, message, is));

    // Grab the cached result
    const result = resultsCache.get(url);

    // Build up history
    result.history.push({
        to: result.to,
        from: result.from,
        text: result.text,
        message: result.message,
        is: result.is,
    });

    // Modify the results
    result.to = to;
    result.from = from;
    result.text = text;
    result.message = message;
    result.is = is;

    // Flag we are cached
    result.cached = true;

    resolve(result);
});
