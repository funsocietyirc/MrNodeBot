'use strict';
const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = async (results) => {
    try {
        const short = require('../lib/_getShortService')(results.uri.domain());
        results.shortUrl = await short(results.url);
        return results;
    } catch (err) {
        logger.warn('Error in URL Shortener function', {
            message: err.message || '',
            stack: err.stack || ''
        });
        return results;
    }
};
