/**
 * @module Irc Client
 * @author Dave Richer
 */

const _ = require('lodash');
const config = require('../config');
const scheduler = require('./scheduler');

/** Node IRC */
const irc = require('funsocietyirc-client');

// Create the client, disable the auto-connect feature if for some reason it gets passed in
config.irc.autoConnect = false;

/** Instance of Node IRC */
const client = new irc.Client(config.irc.server, config.irc.nick, (_.isString(config.nickserv.nick) && // The NickServ nick is a string
    !_.isEmpty(config.nickserv.nick) && // The NickServ nick is not empty
    _.isString(config.nickserv.password) && // The NickServ password is a string
    !_.isEmpty(config.nickserv.password)) ? Object.assign({}, config.irc, {
        channels: [],
}) : config.irc);

// If NickServ is enabled, this will watch a nick to make sure we are on the primary
// If we are not, it will ghost the primary nick and switch to it
scheduler.schedule('maintainPrimaryNick', {
    minute: [new scheduler.Range(0, 59)],
}, () => {
    if (
        client.conn && // We have a connection object
        client.conn.readyState && // We have a ready state
        client.conn.readyState === 'open' && // We are connected to IRC
        !client.conn.requestedDisconnect && // We are not awaiting a disconnect
        _.isString(client.originalNick) && // The original nick is a string
        !_.isEmpty(client.originalNick) && // The original nick is not empty
        _.isString(config.nickserv.nick) && // The NickServ nick is a string
        !_.isEmpty(config.nickserv.nick) && // The NickServ nick is not empty
        _.isString(config.nickserv.password) && // The NickServ password is a string
        !_.isEmpty(config.nickserv.password) && // The NickServ password is not empty
        client.nick !== client.originalNick // We are not already on the original nick we had during connection
    ) {
        // Build up the nickserv nick
        let nickserv = config.nickserv.nick;
        // If we have flood protection, use the _sendImmediate command to push the commands to the top of the stack
        const _send = client.floodProtection ? client._sendImmediate : client.send;
        // if we need to append a chanserv host (dalnet), append it
        if (
            _.includes(config, 'nickserv.host') &&
            _.isString(config.nickserv.host) &&
            !_.isEmpty(config.nickserv.host)
        ) nickserv += `@${config.nickserv.host}`;
        // identify
        _send('PRIVMSG', nickserv, ':identify', config.nickserv.password);
        // Send ghost to kill any existing nicks
        _send('PRIVMSG', nickserv, ':ghost', config.irc.nick);
        // Change nick to primary nick
        _send('NICK', client.originalNick);
        client.nick = client.originalNick;
    }
}, true);

// Export the nick-watcher task to the irc client
client.nickWatcher = scheduler.jobs.maintainPrimaryNick;

// Create the Bot object
module.exports = client;
module.exports.Client = irc.Client;
