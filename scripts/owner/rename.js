'use strict';
const scriptInfo = {
    name: 'rename',
    file: 'rename.js',
    createdBy: 'Dave Richer'
};

/*
    Op Someone
    op <channel> <nick>
*/
module.exports = app => {
    const rename = (to, from, text, message) => {
      let oldNick = app.nick;
      app.nick = text;
      app.say(to, `I was once ${oldNick} but now I am ${app.nick}... The times, they are changing.`);

    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: rename
    });

    // Return the script info
    return scriptInfo;
};
