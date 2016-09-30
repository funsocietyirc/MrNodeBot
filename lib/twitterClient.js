const config = require('../config');
const Twitter = require('twitter');
// Only load if we have the proper twitter credentials
if (!config.apiKeys.twitter.consumerKey ||
    !config.apiKeys.twitter.consumerSecret ||
    !config.apiKeys.twitter.tokenKey ||
    !config.apiKeys.twitter.tokenSecret) {
    return false;
}

const twitterClient =  new Twitter({
    consumer_key: config.apiKeys.twitter.consumerKey,
    consumer_secret: config.apiKeys.twitter.consumerSecret,
    access_token_key: config.apiKeys.twitter.tokenKey,
    access_token_secret: config.apiKeys.twitter.tokenSecret
});

module.exports = twitterClient;
