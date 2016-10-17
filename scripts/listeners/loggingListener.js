'use strict';
const scriptInfo = {
    name: 'loggingListener',
    file: 'loggingListener.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const conLogger = require('../../lib/consoleLogger');
const c = require('irc-colors');

/** Log all incoming channel messages to a Sql Database **/
module.exports = app => {
    // Assure the database exists
    if (!app.Database) {
        return;
    }

    const _handleError = e => conLogger(e, 'error');

    // Log Messages
    const msgCmd = (to, from, text, message) => {
        if (!Models.Logging) {
            return;
        }
        Models.Logging.create({
                from: from,
                to: to,
                text: c.stripColorsAndStyle(text),
                ident: message.user,
                host: message.host
            })
            .catch(_handleError);
    };
    app.Listeners.set('messageLogging', {
        name: 'messageLogging',
        call: msgCmd
    });

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
            .catch(_handleError);
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
            .catch(_handleError);
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
            .catch(_handleError);
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
            .catch(_handleError);
    };
    app.OnQuit.set('quitLogger', {
        call: quitCmd,
        name: 'quitLogger'
    });

    // Log Nick Changes
    const nickCmd = (oldnick, newnick, channels, message) => {
        if (!Models.Alias) {
            return;
        }
        // If we have a database connection, log
        Models.Alias.create({
                oldnick: oldnick,
                newnick: newnick,
                channels: channels.join(),
                user: message.user,
                host: message.host
            })
            .catch(_handleError);
    };
    app.NickChanges.set('nickLogger', {
        name: 'nickLogger'
        call: nickCmd
    });

    // Toppic logging handler
    const topicCmd = (channel, topic, nick, message) => {
        if (!Models.Topics) {
            return;
        }
        Models.Topics.query(qb => {
                qb.where('channel', 'like', channel)
                    .orderBy('id', 'desc')
                    .limit(1)
                    .select(['topic']);
            })
            .fetch()
            .then(lastTopic => {
                if (lastTopic && topic === lastTopic.attributes.topic) {
                    return;
                }
                Models.Topics.create({
                        channel: channel,
                        topic: topic,
                        nick: nick
                    });
            })
            .catch(_handleError);
    };
    app.OnTopic.set('topicLogger', {
        call: topicCmd,
        name: 'topicLogger'
    });


    // Return the script info
    return scriptInfo;
};
