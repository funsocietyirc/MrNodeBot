'use strict';
const Pusher = require('pusher');
const config = require('../config');
module.exports = config.pusher.enabled ? new Pusher(config.pusher.config) : false;
