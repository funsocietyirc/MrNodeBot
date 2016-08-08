'use strict';
/*
    Op Someone
    op <channel> <nick>
*/
module.exports = app => {
    const op = (to, from, text, message) => {
        if (!text) {
            app.Bot.say(to, 'I need some more information...');
            return;
        }
        let txtArray = text.split(' ');
        let channel = txtArray[0];
        let  nick = txtArray[1];
        if(!channel || !nick) {
            app.Bot.say(to, 'I need some more information...');
            return;
        }
        app.Bot.send('mode', channel, '+o', nick);
        app.Bot.say(to, 'I have given all the power to ' + nick + ' on ' + channel);
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('op', {
        desc: 'op [channel] [nick] : Give someone all the powers..',
        access: app.Config.accessLevels.owner,
        call: op
    });
};
