'use strict';
const scriptInfo = {
    name: 'Bot Utilities',
    desc: 'Bot administrative commands',
    createdBy: 'IronY'
};

module.exports = app => {
    // Change the bots nick
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
          let oldNick = app.nick;
          app._ircClient.originalNick = text;
          app.nick = text;
          app.say(from, `I was once ${oldNick} but now I am ${app.nick}... The times, they are changing.`);

        }
    });
    // Get a list of channels the bot is on
    app.Commands.set('channels', {
        desc: 'Get a list of the current joined channels',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
          app.say(from, `I am currently on the following channels: ${app.channels.join(', ')}`);
        }
    });
    // Return the script info
    return scriptInfo;
};
