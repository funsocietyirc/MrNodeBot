const scriptInfo = {
    name: 'voiceRegulars',
    desc: 'Voice regulars',
    createdBy: 'IronY',
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');
const voiceUsers = require('../lib/_voiceUsersInChannel');

module.exports = app => {
    // We are missing things
    if (!app.Database ||
        !_.isObject(app.Config.features.voiceRegulars) || // We need a voiceRegulars block in the features section
        _.isEmpty(app.Config.features.voiceRegulars) || // It must not be empty
        !app.Config.features.voiceRegulars.autoVoice // It is not enabled
    ) return scriptInfo;

    const threshold = (
        _.isSafeInteger(app.Config.features.voiceRegulars.threshold) &&
        app.Config.features.voiceRegulars.threshold >= 0
    ) ? app.Config.features.voiceRegulars.threshold : 250;

    const autoVoiceTimeInMins = (
        _.isSafeInteger(app.Config.features.autoVoiceTimeInMins) &&
        app.Config.features.voiceRegulars >= 1
    ) ? app.Config.features.voiceRegulars.autoVoiceTimeInMins : 40;

    const autoVoiceChannelIgnore = _.isArray(app.Config.features.autoVoiceChannelIgnore) ? app.Config.features.voiceRegulars.autoVoiceChannelIgnore : [];

    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = autoVoiceTimeInMins;

    /**
     * Voice Regulars Schedule
     * @returns {*|unknown[]}
     */
    const voiceRegularsSchedule = () =>
        _.forEach(app.channels, async (channel) => {
            // we are not an op in said channel, or channel is in ignore list
            if (_.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;
            try {
                await voiceUsers(channel, threshold, app);
                logger.info(`Running Voice Regulars in ${channel}`);
            } catch (err) {
                logger.error('Error in Voice Regulars', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
            }
        });
    scheduler.schedule('voiceRegulars', cronTime, voiceRegularsSchedule);

    /**
     * Voice Regulars On Join
     * @param channel
     * @param nick
     * @returns {Promise<void>}
     */
    const voiceRegularsOnJoin = async (channel, nick) => {
        // we are not an op in said channel, or channel is in ignore list
        if (nick === app.nick || _.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;

        try {
            await voiceUsers(channel, threshold, app, {
                nicks: [nick],
            });
        } catch (err) {
            logger.error('Something went wrong in the voice-regulars on-join', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    app.OnJoin.set('voice-regulars', {
        call: voiceRegularsOnJoin,
        name: 'voice-regulars',
    });

    /**
     * Voice Regulars Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const voiceRegularHandler = async (to, from, text) => {
        const channel = text.split(' ')[0] || to;
        if (!app._ircClient.isOpInChannel(channel, app.nick)) {
            app.say(from, `I am not a op in ${to}, ${from}`);
            return;
        }
        try {
            await voiceUsers(channel, threshold, app);
            app.say(to, `I have just voiced all users who meet the threshold of ${threshold} messages (per month), ${from}`);
        } catch (err) {
            logger.error('Something went wrong in the voice-regulars command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong trying to voice the regulars, ${from}`);
        }
    };
    app.Commands.set('voice-regulars', {
        desc: '[channel?] voice regulars in the channel',
        access: app.Config.accessLevels.channelOpIdentified,
        call: voiceRegularHandler,
    });

    return scriptInfo;
};
