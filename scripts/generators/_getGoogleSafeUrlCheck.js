const endPoint = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const config = require('../../config');

// Handle dynamic input types
const urlBuilder = (url) => {
    // Setup the entries
    const threatEntries = [];
    if (_.isArray(url)) {
        _.each(url, suburl => threatEntries.push({
            url: suburl,
        }));
    } else {
        threatEntries.push({
            url,
        });
    }
    return threatEntries;
};

module.exports = async (url) => {
    if (_.isUndefined(config.apiKeys.google) || !_.isString(config.apiKeys.google) || _.isEmpty(config.apiKeys.google)) { throw new Error('Url required for safe check'); }

    if (_.isUndefined(url) || (!_.isString(url) && !_.isArray(url)) || _.isEmpty(url)) { throw new Error('Url required for safe check'); }

    // Setup the entries
    const threatEntries = urlBuilder(url);

    // Make the request
    try {
        const results = await rp({
            uri: endPoint,
            method: 'POST',
            json: true,
            qs: {
                key: config.apiKeys.google,
            },
            body: {
                client: {
                    clientId: 'MrNodeBot',
                    clientVersion: '1',
                },
                threatInfo: {
                    threatTypes: ['THREAT_TYPE_UNSPECIFIED', 'MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                    platformTypes: ['ALL_PLATFORMS'],
                    threatEntryTypes: ['URL'],
                    threatEntries,
                },
            },
        });

        // Return the results
        return results.matches || {};
    }
    // Log Error
    catch (err) {
        logger.error('Error in Google URL Safe check Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw new Error('Error Resolving safe check');
    }
};
