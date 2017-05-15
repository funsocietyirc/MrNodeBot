'use strict';
const scriptInfo = {
  name: 'voiceRegularsOnJoin',
  desc: 'Voice regulars on join',
  createdBy: 'IronY'
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler')
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

  let cronTime = new scheduler.RecurrenceRule();
  cronTime.minute = autoVoiceTimeInMins;
  scheduler.schedule('inviteRegularsInFsociety', cronTime, () =>
    _.forEach(app.channels, channel => {
      // we are not an op in said channel, or channel is in ignore list
      if (_.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;
      voiceUsers(channel, threshold, app)
        .then(result => logger.info(`Running Voice Regulars in ${channel}`))
        .catch(err => logger.error(`Error in Voice Regulars: ${err.message}`));
    })
  );

  // Voice Users on join if they meet a certain threshold
  app.OnJoin.set('voice-regulars', {
    call: (channel, nick, message) => {
      // we are not an op in said channel, or channel is in ignore list
      if (nick === app.nick || _.includes(autoVoiceChannelIgnore, channel) || !app._ircClient.isOpInChannel(channel, app.nick)) return;
      voiceUsers(channel, threshold, app, {
          nicks: [nick]
        })
        .catch(err => logger.error(`fsoceity-voicer: ${err.message}`));
    },
    name: 'voice-regulars'
  });

  return scriptInfo;
};
