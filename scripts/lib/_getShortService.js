// Return the google shortener service if the api key is available, otherwise default to isGd
// The Reason for this, although isGd does not require an api key, it blocks a lot of vpn services
// from using it
const _ = require('lodash');
const config = require('../../config');

const isGd = require('../generators/_isGdShortUrl');
const bitly = require('../generators/_getBitlyShort');
const firebase = require('../generators/_getFirebaseUrl');

module.exports = (domain) => {
    const secondary = !_.isEmpty(config.apiKeys.bitly) ? bitly : isGd;

    // default
    const defaultShort = (!_.isEmpty(config.apiKeys.firebase.apiKey) && !_.isEmpty(config.apiKeys.firebase.pageLinkDomain))
        ? firebase
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
