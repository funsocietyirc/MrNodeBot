'use strict';

const irc = require('irc');
const config = require('../config');
const _ = require('lodash');

// Create the client, disable the autoconnect feature if for some reason it gets passed in
const ircConfig = config.irc;
config.irc.autoConnect = false
const client = new irc.Client(config.irc.server, config.irc.nick, config.irc);



// Check to see if client is currently on a channel
client.isInChannel = function(channel, nick) {
    if(!channel) {
      return false;
    }

    // Log this for easier debugging until it is worked out TODO
    if(config.bot.debug) {
      console.log('ircClient.isInChnanel call:')
      console.log('Channel', channel);
      console.log('Nick', nick);
      console.dir(this.chans);
    }

    channel = channel.toLowerCase();
    // Make sure we have a nick
    nick = nick ? nick.toLowerCase() : this.nick.toLowerCase();
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
