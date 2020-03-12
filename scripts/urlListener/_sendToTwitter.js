const _ = require('lodash');
const t = require('../lib/_ircTypography');
const logger = require('../../lib/logger');

module.exports = async (app, results) => {
    // No Twitter Client, bail
    if (
        !app._twitterClient ||
        !app.Config.features.urls.hasOwnProperty('twitter') ||
        !_.isArray(app.Config.features.urls.twitter)
    ) return results;
    for (const record of app.Config.features.urls.twitter) {
        try {
            const text = `${results.cleanOutput} - ${record.hashtags.join(', ')}`.replace(`${results.from} ${t.icons.sideArrow} `, '');
            const isRetweet = !_.isEmpty(results.twitter) && results.twitter.hasOwnProperty('key');
            if(!isRetweet) {
                await app._twitterClient.post('statuses/update', {
                    status: text,
                });
            }
            else {
                await app._twitterClient.post('statuses/retweet/:id', { id: results.twitter.key });
            }

            // Append results
            results.delivered.push({
                protocol: 'twitter',
                record,
                text,
                isRetweet,
                on: Date.now(),
            });

        } catch (err) {
            logger.info('Something went wrong trying to send a tweet via URL feature', {
                message: err.message || '',
                stack: err.stack || '',
                record,
            });
        }
    }

    return results;
};
