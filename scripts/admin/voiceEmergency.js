'use strict';
const scriptInfo = {
    name: 'Voice Emergency',
    file: 'voiceEmergency.js',
    desc: 'Voice the last 50 active users',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const usersToVoice = 50;

module.exports = app => {
    if(!app.Database || !Models.Logging) return scriptInfo;

    const voiceEmergency = (to, from, text, message) => {
      let [channel] = text.split(' ');
      channel = channel || to;

      if(channel && !app.isInChannel(channel)) {
        app.say(from, `I am not in the channel ${channel}`);
        return;
      }

      Models.Logging.query(qb => qb.where(clause =>
        clause.where('to','like',channel)
      )
      .distinct('from')
      .orderBy('timestamp','desc')
      .limit(usersToVoice)
    )
    .fetchAll()
    .then(results => {
      results.forEach(result => {
        let nick = result.get('from');
        if(!nick || !app.isInChannel(nick, channel)) return;
        console.log(nick);
        console.log(channel);
        console.log(app.isInChannel(nick, channel));
        app._ircClient.send('mode', channel, '+v', nick);
      })
    })



    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('voice-emergency', {
        desc: '[Channel?] Voice the last 50 active people in a channel',
        access: app.Config.accessLevels.admin,
        call: voiceEmergency
    });

    // Return the script info
    return scriptInfo;
};
