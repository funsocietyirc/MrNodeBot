const config = require('../config');
const Twitter = require('twit');

const invalid = () => (!config.apiKeys.twitter.consumerKey ||
    !config.apiKeys.twitter.consumerSecret ||
    !config.apiKeys.twitter.tokenKey ||
    !config.apiKeys.twitter.tokenSecret);

const twitterClient = new Twitter({
    consumer_key: config.apiKeys.twitter.consumerKey,
    consumer_secret: config.apiKeys.twitter.consumerSecret,
    access_token: config.apiKeys.twitter.tokenKey,
    access_token_secret: config.apiKeys.twitter.tokenSecret
});

module.exports = invalid() ? false : twitterClient;
