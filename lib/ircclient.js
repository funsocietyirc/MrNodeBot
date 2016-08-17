'use strict';

const irc = require('irc');
const config = require('../config');
const _ = require('lodash');

const client = new irc.Client(config.irc.server, config.irc.nick, config.irc);

// Check to see if client is currently on a channel
client.isInChannel = function(channel, nick) {
    nick = nick ? nick : this.nick;
    // We are not in this channel
    if (!this.chans.hasOwnProperty(channel) || !this.chans[channel].hasOwnProperty('users')) {
        return false;
    }
    // Lowercase keys
    let nicks = _.mapKeys(this.chans[channel]['users'], (value, key) => {
        return key.toLowerCase();
    });
    return nicks.hasOwnProperty(nick.toLowerCase());
};

// Check if the channel is topic locked
client.isTopicLocked = function(channel) {
    if (!this.isInChannel(channel) || !this.chans[channel].hasOwnProperty('mode')) {
        return false;
    }
    return this.chans[channel]['mode'].indexOf('t') > -1;
};

// Create the Bot object
module.exports = client;
