const scriptInfo = {
    name: 'idle',
    desc: 'Provide random gibberish should the primary channel be inactive for to long',
    createdBy: 'IronY',
};
const _ = require('lodash');

const randomWebLine = require('../generators/_randomWebline');

const moment = require('moment');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const scheduler = require('../../lib/scheduler');

// New and Improved
module.exports = (app) => {
    // Gate
    if (!Models.Logging ||
        _.isUndefined(app.Config.features.idleChat) ||
        app.Config.features.idleChat.enabled !== true ||
        !_.isSafeInteger(app.Config.features.idleChat.timeOutInMins) ||
        !_.isArray(app.Config.features.idleChat.channels) ||
        _.isEmpty(app.Config.features.idleChat.channels)
    ) return scriptInfo;

    scheduler.schedule('checkIdleChat', {
        minute: 0, // First min of every hour
    }, () => isActive());

    const isActive = () => {
        const promises = [];
        const timeoutInMins = app.Config.features.idleChat.timeOutInMins;
        const channels = app.Config.features.idleChat.channels;

        // Log Chance
        logger.info('Checking for idleChat timeout');

        // Iterate over channels
        _.forEach(channels, (channel) => {
            // Bot must be a Op or Voice in the channel
            if (!app._ircClient.isOpOrVoiceInChannel(channel)) return;
            // Push on to promises chain
            promises.push(Models.Logging.query(qb => qb
                .select(['timestamp'])
                .where('to', 'like', channel)
                .orderBy('timestamp', 'desc')
                .limit(1))
                .fetch()
                .then(async (result) => {
                    // Parse timestamp into Moment.js
                    const lastTime = moment(result.get('timestamp'));
                    // Get time diff between now and previous timestamp
                    const timeDiffInMins = moment().diff(lastTime, 'minutes');
                    // Verify the channel has been active
                    if (timeDiffInMins < timeoutInMins) return;
                    // Send to the message
                    try {
                        const line = await randomWebLine();
                        app.say(channel, line);
                    } catch (err) {
                        app.action(channel, 'is not feeling very well');
                    }
                }));
        });

        // Resolve the results
        Promise
            .all(promises)
            .catch(err => logger.error('Error in idleChat Promise chain', {
                err,
            }));
    };

    return scriptInfo;
};
