'use strict';

const _ = require('lodash');
const t = require('./localize');
const config = require('../config');
const logger = require('./logger');
const Hashmap = require('hashmap');

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
client._getChannelData = function(channel, nick) {
    // Return an empty set if the args are not in order
    if (
      _.isUndefined(channel) || !_.isString(channel) || _.isEmpty(channel) ||
      _.isUndefined(nick) || !_.isString(nick) || _.isEmpty(nick)
    ) return {};

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

// Check if a user belongs to a channel
client.isInChannel = function(channel, nick) {
    nick = this._getValidNickOrBotNick(nick).toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    return _.isEmpty(chanData) ? false : chanData.hasOwnProperty(nick);
};

// Check if a user is an op on a channel
client.isOpInChannel = function(channel, nick) {
    return this._userHasModeInChannel(channel,  this._getValidNickOrBotNick(nick), '@');
};

// Check if a user is a voice on a channel
client.isVoiceInChannel = function(channel, nick) {
    return this._userHasModeInChannel(channel,  this._getValidNickOrBotNick(nick), '+');
};

// Check if a user is an op or a voice on a channel
client.isOpOrVoiceInChannel = function(channel, nick) {
    nick =  this._getValidNickOrBotNick(nick);
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

// Create the Bot object
module.exports = client;
