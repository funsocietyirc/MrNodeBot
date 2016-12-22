'use strict';
const scriptInfo = {
    name: 'voiceRegularsOnJoin',
    desc: 'Voice regulars on join',
    createdBy: 'IronY'
};
const _ = require('lodash');
const voiceUsers = require('../lib/_voiceUsersInChannel');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler')

module.exports = app => {
    // We are missing things
    if (!app.Database || !app.Config.features.voiceRegulars || !app.Config.features.voiceRegulars.autoVoice) return scriptInfo;

    const threshold = (
      _.isUndefined(app.Config.features.voiceRegulars) ||
      !_.isSafeInteger(app.Config.features.voiceRegulars) ||
      app.Config.features.voiceRegulars < 1
    ) ? app.Config.features.voiceRegulars.threshold : 250;

    const autoVoiceTimeInMins = (
      _.isUndefined(app.Config.features.voiceRegulars) ||
      !_.isSafeInteger(app.Config.features.autoVoiceTimeInMins) ||
      app.Config.features.voiceRegulars < 1
    ) ? app.Config.features.voiceRegulars.autoVoiceTimeInMins : 40;

    const autoVoiceChannelIgnore = (
      _.isUndefined(app.Config.features.voiceRegulars) ||
      !_.isArray(app.Config.features.autoVoiceChannelIgnore)
    ) ? app.Config.features.voiceRegulars.autoVoiceChannelIgnore : [];

    let cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = autoVoiceTimeInMins;
    scheduler.schedule('inviteRegularsInFsociety', cronTime, () =>
        _.forEach(app.channels, channel => {
            // we are not an op in said channel
            if ( _.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;
            voiceUsers(channel, threshold, app)
                .then(result => logger.info(`Running Voice Regulars in ${channel}`))
                .catch(err => logger.error(`Error in Voice Regulars: ${err.message}`));
        })
    );

    // Voice Users on join if they meet a certain threshold
    app.OnJoin.set('voice-regulars', {
        call: (channel, nick, message) => {
            // we are not an op in said channel
            if (nick == app.nick || _.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;
            voiceUsers(channel, threshold, app, {
                    nicks: [nick]
                })
                .catch(err => logger.error(`fsoceity-voicer: ${err.message}`));
        },
        name: 'voice-regulars'
    });

    return scriptInfo;
};
