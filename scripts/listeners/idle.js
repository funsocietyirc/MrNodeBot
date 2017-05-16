'use strict';
const scriptInfo = {
    name: 'idle',
    desc: 'Provide random gibberish should the primary channel be inactive for to long',
    createdBy: 'IronY'
};
const _ = require('lodash');
const fml = require('../generators/_fmlLine');
const bofh = require('../generators/_bofhExcuse');
const shower = require('../generators/_showerThoughts');
const moment = require('moment');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const scheduler = require('../../lib/scheduler');

// New and Improved
module.exports = app => {
    // Gate
    if (!Models.Logging ||
        _.isUndefined(app.Config.features.idleChat) ||
        app.Config.features.idleChat.enabled !== true ||
        !_.isSafeInteger(app.Config.features.idleChat.timeOutInMins) ||
        !_.isArray(app.Config.features.idleChat.channels) ||
        _.isEmpty(app.Config.features.idleChat.channels)
    ) return scriptInfo;

    // Clear cache every four hours on the 30 min mark
    scheduler.schedule('checkIdleChat', {
        minute: 0 // First min of every hour
    }, () => {
        isActive();
    });

    const isActive = () => {
        let promises = [];
        let timeoutInMins = app.Config.features.idleChat.timeOutInMins;
        let channels = app.Config.features.idleChat.channels;

        // Log Chance
        logger.info('Checking for idleChat timeout');

        // Iterate over channels
        _.forEach(channels, channel => {
            // Bot must be a Op or Voice in the channel
            if (!app._ircClient.isOpOrVoiceInChannel(channel)) return;
            // Push on to promises chain
            promises.push(
                Models.Logging.query(qb => qb
                    .select(['timestamp'])
                    .where('to', 'like', channel)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                )
                    .fetch()
                    .then(result => {
                        // Parse timestamp into Moment.js
                        let lastTime = moment(result.get('timestamp'));
                        // Get time diff between now and previous timestamp
                        let timeDiffInMins = moment().diff(lastTime, 'minutes');
                        // Verify the channel has been active
                        if (timeDiffInMins < timeoutInMins) return;
                        // Send to the message
                        _.sample([fml, bofh, shower])(1)
                            .then(message => app.notice(channel, _.first(message)));
                    })
            );
        });

        // Resolve the results
        Promise
            .all(promises)
            .catch(err => logger.error('Error in idleChat Promise chain', {
                err
            }));
    };

    return scriptInfo;
};
