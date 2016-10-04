'use strict';
const scriptInfo = {
    name: 'Channels',
    file: 'channel.js',
    createdBy: 'Dave Richer'
};

/*
    Join a channel
    join <channel>
*/
module.exports = app => {

    // Part Channel
    const part = (to, fro, text, message) => {
      if (!text) {
          app.say(from, 'I need some more information...');
          return;
      }
      let channel = text.getFirst();
      if (!channel) {
          app.say(from, 'I need some more information...');
          return;
      }

      // Part the channel
      // TODO Check if in channel
      app._ircClient.part(channel, () => {
          app.say(from, `I have parted ${channel}`);
      });
    };
    app.Commands.set('part', {
        desc: 'part [channel] Part a channel',
        access: app.Config.accessLevels.owner,
        call: part
    });

    // Join Channel
    const join = (to, from, text, message) => {
        if (!text) {
            app.say(from, 'I need some more information...');
            return;
        }
        let channel = text.getFirst();
        if (!channel) {
            app.say(from, 'I need some more information...');
            return;
        }

        // Join the channel
        app._ircClient.join(channel, () => {
            app.say(from, `I have joined ${channel}`);
        });

    };
    app.Commands.set('join', {
        desc: 'join [channel] Join a channel',
        access: app.Config.accessLevels.owner,
        call: join
    });

    // OP Someone
    const op = (to, from, text, message) => {
        if (!text) {
            app.say(to, 'I need some more information...');
            return;
        }
        let txtArray = text.split(' ');
        let channel = txtArray[0];
        let nick = txtArray[1];
        if (!channel || !nick) {
            app.say(to, 'I need some more information...');
            return;
        }
        app._ircClient.send('mode', channel, '+o', nick);
        app.say(to, 'I have given all the power to ' + nick + ' on ' + channel);
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('op', {
        desc: 'op [channel] [nick] : Give someone all the powers..',
        access: app.Config.accessLevels.owner,
        call: op
    });

    // Return the script info
    return scriptInfo;
};
