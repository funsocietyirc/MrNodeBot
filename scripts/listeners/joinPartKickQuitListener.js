'use strict';
const scriptInfo = {
    name: 'joinPartKickQuitListener',
    file: 'joinPartKickQuitListener.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const conLogger = require('../../lib/consoleLogger');

/** Log all incoming channel messages to a Sql Database **/
module.exports = app => {
    // Assure the database exists
    if (!app.Database) {
        return;
    }

    // Log Channel joins
    const joinCmd = (channel, nick, message) => {
        if (!Models.JoinLogging) {
            return;
        }
        Models.JoinLogging.create({
                nick: nick,
                channel: channel,
                user: message.user,
                host: message.host
            })
            .catch(err => {
                conLogger(e, 'error');
            });
    };
    app.OnJoin.set('joinLogger', {
        call: joinCmd,
        name: 'joinLogger'
    });

    // Log Channel Parts
    const partCmd = (channel, nick, reason, message) => {
        if (!Models.PartLogging) {
            return;
        }
        Models.PartLogging.create({
                nick: nick,
                channel: channel,
                reason: reason,
                user: message.user,
                host: message.host
            })
            .catch(err => {
                conLogger(e, 'error');
            });
    };
    app.OnPart.set('partLogger', {
        call: partCmd,
        name: 'partLogger'
    });

    // Log Kicks
    const kickCmd = (channel, nick, by, reason, message) => {
        if (!Models.KickLogging) {
            return;
        }
        Models.KickLogging.create({
                nick: nick,
                channel: channel,
                reason: reason,
                by: by,
                user: message.user,
                host: message.host
            })
            .catch(err => {
                conLogger(e, 'error');
            });
    };
    app.OnKick.set('kickLogger', {
        call: kickCmd,
        name: 'kickLogger'
    });

    // Log Quits
    const quitCmd = (nick, reason, channels, message) => {
        if (!Models.QuitLogging) {
            return;
        }
        console.log(nick, reason, channels);
        Models.QuitLogging.create({
                nick: nick,
                reason: reason,
                channels: channels.join(),
                user: message.user,
                host: message.host
            })
            .catch(err => {
                conLogger(e, 'error');
            });
    };
    app.OnQuit.set('quitLogger', {
        call: quitCmd,
        name: 'quitLogger'
    });

    // Return the script info
    return scriptInfo;
};
