const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const config = require('../../config');
module.exports = async (url) => {
    // Check for firebase API Key
    const firebaseKey = _.getString(_.get(config, 'apiKeys.firebase.apiKey', null));
    const pageLink = _.getString(_.get(config, 'apiKeys.firebase.pageLinkDomain', null));

    // Verify we have a API key
    if (!_.isString(firebaseKey) || !_.isString(pageLink)) {
        throw new Error('You are trying to use the Firebase URL api, and do not have a key');
    }

    try {
        const results = await rp({
            uri: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks',
            method: 'POST',
            json: true,
            qs: {
                key: firebaseKey,
            },
            body: {
                dynamicLinkInfo: {
                    dynamicLinkDomain: pageLink,
                    link: url,
                },
                suffix: {
                    option: 'SHORT',
                },
            },
        });
        return results.shortLink || '';
    } catch (err) {
        if (err.statusCode && err.statusCode === 400) return;

        // We have a short url, just bail
        logger.error('Something went wrong in the _getFirebaseUrl generator', {
            message: err.message || '',
            stack: err.stack || '',
        });

        throw err;
    }
};

