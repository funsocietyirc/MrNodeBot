const scriptInfo = {
    name: 'loggingListener',
    desc: 'Log IRC events to the database',
    createdBy: 'IronY',
};
const _ = require('lodash');
const c = require('irc-colors');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

// Log all incoming channel messages to a Sql Database
module.exports = (app) => {
    // Assure the database exists
    if (!app.Database) return scriptInfo;

    // Log Messages
    const msgCmd = (to, from, text, message) => {
        if (!Models.Logging) return;
        Models.Logging.create({
            from,
            to,
            text: c.stripColorsAndStyle(text),
            ident: message.user,
            host: message.host,
        }).catch(() => logger.error('Something went wrong logging message'));
    };
    app.Listeners.set('messageLogging', {
        name: 'messageLogging',
        call: msgCmd,
    });

    // Log Ctcp
    const ctcpCmd = (from, to, text, type, message) => {
        if (!Models.CtcpLogging) return;
        Models.CtcpLogging.create({
            from,
            to,
            text: c.stripColorsAndStyle(text),
            type,
            user: message.user,
            host: message.host,
        }).catch(() => logger.error('Something went wrong logging ctcp command'));
    };
    app.OnCtcp.set('ctcpLogging', {
        name: 'ctcpLogging',
        call: ctcpCmd,
    });

    // Log Channel Parts
    const actionCmd = (from, to, text, message) => {
        // We do not have database, or we are talking to ourselves
        if (!Models.ActionLogging) return;
        Models.ActionLogging.create({
            from,
            to,
            text: c.stripColorsAndStyle(text),
            user: message.user,
            host: message.host,
        }).catch(() => logger.error('Something went wrong logging action'));
    };
    app.OnAction.set('actionLogger', {
        call: actionCmd,
        name: 'actionLogger',
    });

    const noticeCmd = (from, to, text, message) => {
        // We do not have database, or we are talking to ourselves
        if (!Models.NoticeLogging || _.isNull(from) || _.isNull(message.user) || _.isNull(message.host)) return;
        Models.NoticeLogging.create({
            from,
            to,
            text: c.stripColorsAndStyle(text),
            user: message.user,
            host: message.host,
        }).catch(() => logger.error('Something went wrong logging notice'));
    };
    app.OnNotice.set('noticeLogger', {
        call: noticeCmd,
        name: 'noticeLogger',
    });

    // Log Channel joins
    const joinCmd = (channel, nick, message) => {
        if (!Models.JoinLogging) return;
        Models.JoinLogging.create({
            nick,
            channel,
            user: message.user,
            host: message.host,
        })
            .catch(() => {
                logger.error(`Something went wrong logging join for ${channel}`);
            });
    };
    app.OnJoin.set('joinLogger', {
        call: joinCmd,
        name: 'joinLogger',
    });

    // Log Channel Parts
    const partCmd = (channel, nick, reason, message) => {
        if (!Models.PartLogging) return;
        Models.PartLogging.create({
            nick,
            channel,
            reason,
            user: message.user,
            host: message.host,
        })
            .catch(() => logger.error(`Something went wrong logging part for ${channel}`));
    };
    app.OnPart.set('partLogger', {
        call: partCmd,
        name: 'partLogger',
    });

    // Log Kicks
    const kickCmd = (channel, nick, by, reason, message) => {
        if (!Models.KickLogging) return;
        Models.KickLogging.create({
            nick,
            channel,
            reason,
            by,
            user: message.user,
            host: message.host,
        }).catch(() => logger.error(`Something went wrong logging part for ${channel}`));
    };
    app.OnKick.set('kickLogger', {
        call: kickCmd,
        name: 'kickLogger',
    });

    // Log Quits
    const quitCmd = (nick, reason, channels, message) => {
        if (!Models.QuitLogging) return;
        Models.QuitLogging.create({
            nick,
            reason,
            channels: _.isArray(channels) ? channels.join() : '',
            user: message.user,
            host: message.host,
        }).catch(() => logger.error(`Something went wrong logging quit for ${_.isArray(channels) ? channels.join() : ''}`));
    };
    app.OnQuit.set('quitLogger', {
        call: quitCmd,
        name: 'quitLogger',
    });

    // Log Nick Changes
    const nickCmd = (oldnick, newnick, channels, message) => {
        if (!Models.Alias) return;
        // If we have a database connection, log
        Models.Alias.create({
            oldnick,
            newnick,
            channels: channels.join(),
            user: message.user,
            host: message.host,
        }).catch(() => logger.error(`Something went wrong nick change ${oldnick} to ${newnick}`));
    };
    app.NickChanges.set('nickLogger', {
        name: 'nickLogger',
        call: nickCmd,
    });

    // Topic logging handler
    const topicCmd = (channel, topic, nick, message) => {
        if (!Models.Topics) return;
        Models.Topics.query((qb) => qb.where('channel', 'like', channel)
            .orderBy('id', 'desc')
            .limit(1)
            .select(['topic']))
            .fetch()
            .then((lastTopic) => {
                if (lastTopic && topic === lastTopic.attributes.topic) return;
                Models.Topics.create({
                    channel,
                    topic,
                    nick,
                    user: message.user,
                    host: message.host,
                });
            }).catch(() => logger.error(`Something went wrong topic change for ${channel}`));
    };
    app.OnTopic.set('topicLogger', {
        call: topicCmd,
        name: 'topicLogger',
    });

    // Return the script info
    return scriptInfo;
};
