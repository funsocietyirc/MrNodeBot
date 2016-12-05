'use strict';
const _ = require('lodash');
const Pusher = require('pusher');
const config = require('../config');
module.exports = (!_.isUndefined(config.pusher) && _.isBoolean(config.pusher.enabled) && config.pusher.enabled === true) ? new Pusher(config.pusher.config) : false;
