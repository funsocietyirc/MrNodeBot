const _ = require('underscore');
const config = require('../config');
const Twitter = require('twit');

const invalid = () =>  _.isUndefined(config.apiKeys.twitter) ||
    _.isUndefined(config.apiKeys.twitter.consumerKey) || _.isEmpty(config.apiKeys.twitter.consumerKey) ||
    _.isUndefined(config.apiKeys.twitter.tokenKey) || _.isEmpty(config.apiKeys.twitter.consumerKey) ||
    _.isUndefined(config.apiKeys.twitter.tokenSecret) || _.isEmpty(config.apiKeys.twitter.consumerKey) ||
    _.isUndefined(config.features.twitter) || _.isUndefined(config.features.twitter.enabled) || !config.features.twitter.enabled;


const twitterClient = new Twitter({
    consumer_key: config.apiKeys.twitter.consumerKey,
    consumer_secret: config.apiKeys.twitter.consumerSecret,
    access_token: config.apiKeys.twitter.tokenKey,
    access_token_secret: config.apiKeys.twitter.tokenSecret
});

module.exports = invalid() ? false : twitterClient;
