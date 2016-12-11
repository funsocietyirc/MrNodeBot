'use strict';
const scriptInfo = {
    name: 'loggingListener',
    desc: 'Log IRC evets to the database',
    createdBy: 'IronY'
};

const _ = require('lodash');
const c = require('irc-colors');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');

/** Log all incoming channel messages to a Sql Database **/
module.exports = app => {
    // Assure the database exists
    if (!app.Database) return;

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
            .catch(logger.error);
    };
    app.Listeners.set('messageLogging', {
        name: 'messageLogging',
        call: msgCmd
    });

    // Log Ctcp
    const ctcpCmd = (from, to, text, type, message) => {
        if (!Models.CtcpLogging) {
            return;
        }
        Models.CtcpLogging.create({
                from: from,
                to: to,
                text: c.stripColorsAndStyle(text),
                type: type,
                user: message.user,
                host: message.host
            })
            .catch(logger.error);
    };
    app.OnCtcp.set('ctcpLogging', {
        name: 'ctcpLogging',
        call: ctcpCmd
    });

    // Log Channel Parts
    const actionCmd = (from, to, text, message) => {
        // We do not have database, or we are talking to ourselves
        if (!Models.ActionLogging) {
            return;
        }
        Models.ActionLogging.create({
                from: from,
                to: to,
                text: c.stripColorsAndStyle(text),
                user: message.user,
                host: message.host
            })
            .catch(logger.error);
    };
    app.OnAction.set('actionLogger', {
        call: actionCmd,
        name: 'actionLogger'
    });

    const noticeCmd = (from, to, text, message) => {
        // We do not have database, or we are talking to ourselves
        if (!Models.NoticeLogging || _.isNull(from) || _.isNull(message.user) || _.isNull(message.host)) return;
        Models.NoticeLogging.create({
                from: from,
                to: to,
                text: c.stripColorsAndStyle(text),
                user: message.user,
                host: message.host
            })
            .catch(logger.error);
    };
    app.OnNotice.set('noticeLogger', {
        call: noticeCmd,
        name: 'noticeLogger'
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
            .catch(logger.error);
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
            .catch(logger.error);
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
            .catch(logger.error);
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
        Models.QuitLogging.create({
                nick: nick,
                reason: reason,
                channels: channels.join(),
                user: message.user,
                host: message.host
            })
            .catch(logger.error);
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
            .catch(logger.error);
    };
    app.NickChanges.set('nickLogger', {
        name: 'nickLogger',
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
                    nick: nick,
                    user: message.user,
                    host: message.host
                });
            })
            .catch(logger.error);
    };
    app.OnTopic.set('topicLogger', {
        call: topicCmd,
        name: 'topicLogger'
    });


    // Return the script info
    return scriptInfo;
};
