'use strict';
const scriptInfo = {
    name: 'Safe Check',
    desc: 'Check the safety of a URL',
    createdBy: 'IronY'
};
const _ = require('lodash');
const logger = require('../../lib/logger.js');
const safe = require('../generators/_getGoogleSafeUrlCheck');
const extractUrls = require('../../lib/../lib/extractUrls');

module.exports = app => {
    // We require a google API Key for this command
    if (_.isUndefined(app.Config.apiKeys.google) || !_.isString(app.Config.apiKeys.google) || _.isEmpty(app.Config.apiKeys.google)) return scriptInfo;

    const safeCheck = async (to, from, text, message) => {
        // No Data given
        if (!_.isString(text) || _.isEmpty(text)) {
            app.say(to, `I need some more data to work with, ${from}`);
            return;
        }

        // Extract the urls
        const urls = extractUrls(text);

        // No results in text
        if (!urls.length) {
            app.say(to, `There are no URLs present in your text, ${from}`);
            return;
        }

        try {
            const results = await safe(urls);

            // No Threats detected
            if (!results.length) {
                app.say(to, `No Threats have been detected in these urls, ${from}`);
                return;
            }

            // Iterate over the results
            _.each(results, result => {
                // Not enough information to provide a line
                if (!result.threatType || !result.platformType || !result.threat.url) return;
                // say it back to irc
                app.say(to, `Warning ${_.startCase(result.threatType).toLowerCase()} threat detected on ${result.threat.url} for ${_.startCase(result.platformType).toLowerCase()}`);
            });

        }
        catch (err) {
            logger.error('Error Completing a safe check request', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, err.message ? err.message : `Something went wrong with the Safe Check request, ${from}`);
        }
    };

    app.Commands.set('safe-check', {
        desc: '[urls] Safe Check a URL',
        access: app.Config.accessLevels.admin,
        call: safeCheck
    });

    return scriptInfo;
};
