'use strict';

const _ = require('lodash');
const t = require('./localize');
const config = require('../config');
const logger = require('./logger');
const helpers = require('../helpers');
const scheduler = require('./scheduler');

// If we have a debug flag set, load in the node-irc lib sitting beside the MrNodeBot folder
const irc = config.ircClientDebug ? require('../../node-irc') : require('irc');

// Create the client, disable the autoconnect feature if for some reason it gets passed in
config.irc.autoConnect = false
const client = new irc.Client(config.irc.server, config.irc.nick, config.irc);

// Get channel data normalized to lowercase
client._getChannels = function() {
    return _(this.chans).mapKeys((v, k) => k.toLowerCase()).value()
};

// Get a normalized channel data object
// Returns an empty object if the channel data does not exist or the arguments are incorrect
client._getChannelData = function(channel, nick) {
    // Return an empty set if the args are not in order
    if (
        _.isUndefined(channel) || !_.isString(channel) || _.isEmpty(channel) ||
        _.isUndefined(nick) || !_.isString(nick) || _.isEmpty(nick)
    ) return Object.create(null);

    // Normalize chanel
    channel = channel.toLowerCase();

    // Make sure we have a nick, and normalize
    nick = nick.toLowerCase();

    // Lower case the keys
    let chans = this._getChannels();

    // Check if key exists
    if (!chans.hasOwnProperty(channel)) return {};

    // Lowercase the user, and check if user exists
    return _(chans[channel]['users'])
        .mapKeys((value, key) => key.toLowerCase())
        .value();
};

// Get an array of valid channel prefixes
client._getChannelPrefixArray = function() {
    return _(this.opt.channelPrefixes.split('')).compact().value();
};

// Check to see if a channel has a mode
client._channelHasMode = function(channel, mode) {
    return (
        _.isUndefined(channel) || !_.isString(channel) || _.isEmpty(channel) || // No Channel given
        _.isUndefined(mode) || !_.isString(mode) || _.isEmpty(channel) || // No mode given
        !_.has(this.chans, channel) || // Am not in channel
        !this.chans[channel].hasOwnProperty('mode') // Does not have modes
    ) ? false : this.chans[channel]['mode'].indexOf(mode) > -1;
};

// Return a nickname, or the bots nick
client._getValidNickOrBotNick = function(nick) {
    // log if we have no nick given, and no bot nick available
    if (
        (_.isUndefined(nick) || !_.isString(nick) || _.isEmpty(nick)) &&
        (_.isUndefined(this.nick) || !_.isString(this.nick) || _.isEmpty(this.nick))
    ) logger.error('A call to _getValidNickOrBotNick was not given a nick and a bot nick does not exist', {
        nick
    });
    return (_.isUndefined(nick) || !_.isString(nick) || _.isEmpty(nick)) ? this.nick : nick;
};

// Check if a user has a mode in a channel
client._userHasModeInChannel = function(channel, nick, mode) {
    // No Channel was provided
    if (_.isUndefined(channel) || !_.isString(channel) || _.isEmpty(channel) || !this.isChannel(channel)) return false;
    // No Nick specified
    if (_.isUndefined(nick) || !_.isString(nick) || _.isEmpty(nick)) return false;
    // No mode specified
    if (_.isUndefined(mode) || !_.isString(mode) || _.isEmpty(mode)) return false;
    // Fetch Channel data
    nick = nick.toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    return !_.isEmpty(chanData) ? chanData.hasOwnProperty(nick) && _.includes(chanData[nick], mode) : false;
};

// Check if a entity is a valid channel name
client.isChannel = function(entity) {
    let prefixes = this._getChannelPrefixArray();
    for (let prefix of prefixes) {
        if (entity[0] === prefix) return true;
    }
    return false;
};

// Get an Array containing users in a channel
// Will return empty Array if results are not available or channel is not specified
client.getUsers = function(channel) {
    // No Channel given, return empty array
    if (_.isUndefined(channel) || !_.isString(channel) || _.isEmpty(channel)) return [];
    // Normalize chanel
    channel = channel.toLowerCase();
    // Get Channel data
    let chans = this._getChannels();
    // Check if user is in channel
    return (chans && chans.hasOwnProperty(channel) && chans[channel].users) ? _.orderBy(Object.keys(chans[channel].users)) : [];
};

// Used to avoid channel private messages
// CPRIVMSG <nickname> <channel> :<message>
// Sends a private message to <nickname> on <channel> that bypasses flood protection limits. The target nickname must be in the same channel as the client issuing the command, and the client must be a channel operator.
// Normally an IRC server will limit the number of different targets a client can send messages to within a certain time frame to prevent spammers or bots from mass-messaging users on the network, however this command can be used by channel operators to bypass that limit in their channel. For example, it is often used by help operators that may be communicating with a large number of users in a help channel at one time.
// This command is not formally defined in an RFC, but is in use by some IRC networks. Support is indicated in a RPL_ISUPPORT reply (numeric 005) with the CPRIVMSG keyword
// TODO Devise a way to see if the server does infact support this
client.cSay = function(nick, channel, message) {
    // We do not have the required permissions to send a cprivmsg, default back to say
    if (!this.isOpInChannel(channel) ||
        !this.isChannel(channel) ||
        !this.isInChannel(channel, nick)
    ) {
      return;
    }
    // Send a channel private message
    else {
        let _send = this.floodProtection ? this._sendImmediate : this.send;
        _send('CPRIVMSG',`${nick} ${channel}` ,`${message}`);
    }
};

// Check if a user belongs to a channel
client.isInChannel = function(channel, nick) {
    nick = this._getValidNickOrBotNick(nick).toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    return _.isEmpty(chanData) ? false : chanData.hasOwnProperty(nick);
};

// Check if a user is an op on a channel
client.isOpInChannel = function(channel, nick) {
    return this._userHasModeInChannel(channel, this._getValidNickOrBotNick(nick), '@');
};

// Check if a user is a voice on a channel
client.isVoiceInChannel = function(channel, nick) {
    return this._userHasModeInChannel(channel, this._getValidNickOrBotNick(nick), '+');
};

// Check if a user is an op or a voice on a channel
client.isOpOrVoiceInChannel = function(channel, nick) {
    nick = this._getValidNickOrBotNick(nick);
    return this._userHasModeInChannel(channel, nick, '+') || this._userHasModeInChannel(channel, nick, '@');
};

// Check to see if a channel is topic locked
client.isTopicLocked = function(channel) {
    return this._channelHasMode(channel, 't');
};

// Check see if a channel allows color
client.isColorEnabled = function(channel) {
    return !this._channelHasMode(channel, 'c');
};

// Can the bot edit the topic for a channel
client.canModifyTopic = function(channel) {
    return this.isOpInChannel(channel) || !this.isTopicLocked(channel);
};

// Return if this is our self
client.isBotNick = function(nick) {
    if (_.isUndefined(nick) || _.isUndefined(this.nick) || !_.isString(nick) || !_.isString(this.nick) || _.isEmpty(nick) || _.isEmpty(this.nick)) return false;
    return this.nick.toLowerCase() === nick.toLowerCase();
};

// Whois Promise
client.whoisPromise = nick => new Promise((resolve, reject) => {
    client.whois(nick, info => {
        if (!info) {
            reject(new Error('libraries:whoisFailed', {
                nick
            }));
            return;
        }
        resolve(info);
    });
});


// If NickServ is enabled, this will watch a nick to make sure we are on the primary
// If we are not, it will ghost the primary nick and switch to it
const nickWatcher = scheduler.schedule('maintainPrimaryNick', {
    minute: [new scheduler.Range(0, 59)]
}, () => {
    if (
        _.isString(client.originalNick) && // The original nick is a string
        !_.isEmpty(client.originalNick) && // The original nick is not empty
        _.isString(config.nickserv.nick) && // The NickServ nick is a string
        !_.isEmpty(config.nickserv.nick) && // The NickServ nick is not empty
        (_.isUndefined(client.conn) || _.isNull(client.conn)) && // We have no connection
        client.conn && // We have a connection object
        client.conn.readyState == 'open' && // We are connected to IRC
        !client.conn.requestedDisconnect && // We are not awaiting a disconnect
        _.isString(config.nickserv.password) && // The NickServ password is a string
        !_.isEmpty(config.nickserv.password) && // The NickServ password is not empty
        client.nick !== client.originalNick // We are not already on the original nick we had during connection
    ) {
        // Build up the nickserv nick
        let nickserv = config.nickserv.nick;
        // If we have flood protection, use the _sendImmediate command to push the commands to the top of the stack
        let _send = client.floodProtection ? client._sendImmediate : client.send;
        // if we need to append a chanserv host (dalnet), append it
        if (_.includes(config, 'nickserv.host') && _.isString(config.nickserv.host) && !_.isEmpty(config.nickserv.host)) nickserv = nickserv + `@${config.nickserv.host}`;
        // identify
        _send('PRIVMSG', nickserv, ':identify', config.nickserv.password);
        // Send ghost to kill any existing nicks
        _send('PRIVMSG', nickserv, ':ghost', config.irc.nick);
        // Change nick to primary nick
        _send('NICK', client.originalNick);
        client.nick = client.originalNick;
    }
}, true);

// Export the nickwatcher task to the irc client
client.nickWatcher = nickWatcher;

// Create the Bot object
module.exports = client;
