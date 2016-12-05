'use strict';
// Return the google shortner service if the api key is available, otherwise default to isGd
const _ = require('lodash');
const config = require('../../config');

const isGd = require('../generators/_isGdShortUrl');
const google = require('../generators/_googleShortUrl')

module.exports = !_.isUndefined(config.apiKeys.google) && _.isString(config.apiKeys.google) && !_.isEmpty(config.apiKeys.google) ? google : isGd;
