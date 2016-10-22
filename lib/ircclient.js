'use strict';



const config = require('../config');
const _ = require('lodash');

const irc = config.ircClientDebug ? require('../../node-irc') : require('irc');

// Create the client, disable the autoconnect feature if for some reason it gets passed in
const ircConfig = config.irc;
config.irc.autoConnect = false
const client = new irc.Client(config.irc.server, config.irc.nick, config.irc);



// Check to see if client is currently on a channel
client.isInChannel = function(channel, nick) {
    if(!channel) {
      return false;
    }

    // Normalize chanel
    channel = channel.toLowerCase();
    // Make sure we have a nick, and normalize
    nick = nick && _.isString(nick) ? nick.toLowerCase() : this.nick.toLowerCase();

    let chans = _(this.chans).mapKeys((v, k) => k.toLowerCase()).value();
    if(!chans.hasOwnProperty(channel)) return false;
    return (_(chans[channel]['users']).mapKeys((value, key) => key.toLowerCase()).value()).hasOwnProperty(nick);
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
