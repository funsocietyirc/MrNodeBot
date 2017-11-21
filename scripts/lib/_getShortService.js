// Return the google shortener service if the api key is available, otherwise default to isGd
// The Reason for this, although isGd does not require an api key, it blocks a lot of vpn services
// from using it
const _ = require('lodash');
const config = require('../../config');

const isGd = require('../generators/_isGdShortUrl');
const google = require('../generators/_googleShortUrl');
const bitly = require('../generators/_getBitlyShort');

module.exports = (domain) => {
    const secondary = !_.isEmpty(config.apiKeys.bitly) ? bitly : isGd;

    // default
    const defaultShort = !_.isEmpty(config.apiKeys.google)
        ? google
        : secondary;

    // No Domain provided
    if (_.isEmpty(domain)) { return defaultShort; }

    // Domain Exceptions
    switch (domain) {
    case 'dropboxusercontent.com':
        return secondary;
    default:
        return defaultShort;
    }
};
