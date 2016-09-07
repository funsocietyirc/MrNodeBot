'use strict';

const irc = require('irc');
const config = require('../config');
const _ = require('lodash');

const client = new irc.Client(config.irc.server, config.irc.nick, config.irc);

// Create the Bot object
module.exports = function () {
    console.log('IRC Client created');
    return new irc.Client(config.irc.server, config.irc.nick, config.irc);
}();
