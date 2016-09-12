'use strict';
/*
    Op Someone
    op <channel> <nick>
*/
module.exports = app => {
    const rename = (to, from, text, message) => {
      app.say(to, `I was once ${app.nick} but now I am ${text || app.Config.irc.nick}... The times, they are changing.`);
      app.rename(text);
    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: rename
    });
};
