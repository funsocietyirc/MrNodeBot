'use strict';

const _ = require('lodash');
const t = require('./localize');
const config = require('../config');
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

// Check to see if client is currently on a channel
client._getChannelData = function(channel, nick) {
    // Bail if we have no channel
    if (!channel || !nick) return false;

    // Normalize chanel
    channel = channel.toLowerCase();

    // Make sure we have a nick, and normalize
    nick = nick.toLowerCase();

    // Lower case the keys
    let chans = this._getChannels();

    // Check if key exists
    if (!chans.hasOwnProperty(channel)) return false;

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
    return (!channel || !mode || !this.isInChannel(channel) || !this.chans[channel].hasOwnProperty('mode')) ?
        false :
        this.chans[channel]['mode'].indexOf(mode) > -1;
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
    // Normalize chanel
    channel = channel.toLowerCase();
    // Get Channel data
    let chans = this._getChannels();
    // Check if user is in channel
    return (chans && chans.hasOwnProperty(channel) && chans[channel].users) ? _.orderBy(Object.keys(chans[channel].users)) : [];
};

// Check if a user belongs to a channel
client.isInChannel = function(channel, nick) {
    nick = nick ? nick.toLowerCase() : this.nick.toLowerCase();
    let chanData = this._getChannelData(channel, nick);

    if (!chanData) return false;
    return chanData.hasOwnProperty(nick);
};

// Check if a user is an op on a channel
client.isOpInChannel = function(channel, nick) {
    nick = nick ? nick.toLowerCase() : this.nick.toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    if (!chanData) return false;
    return chanData.hasOwnProperty(nick) && _.includes(chanData[nick], '@');
};

// Check if a user is a voice on a channel
client.isVoiceInChannel = function(channel, nick) {
    nick = nick ? nick.toLowerCase() : this.nick.toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    if (!chanData) return false;
    return chanData.hasOwnProperty(nick) && _.includes(chanData[nick], '+');
};

// Check if a user is an op or a voice on a channel
client.isOpOrVoiceInChannel = function(channel, nick) {
    nick = nick ? nick.toLowerCase() : this.nick.toLowerCase();
    let chanData = this._getChannelData(channel, nick);
    if (!chanData) return false;
    return chanData.hasOwnProperty(nick) && (_.includes(chanData[nick], '+') || _.includes(chanData[nick], '@'));
};

// Check to see if a channel is topic locked
client.isTopicLocked= function(channel) {
  return this._channelHasMode(channel, 't')
}

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
