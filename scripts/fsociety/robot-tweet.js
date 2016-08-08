'use strict';
const Twitter = require('twitter');
const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');

module.exports = app => {

    if (!helpers.IsSet(process.env.twitter_consumer_key) ||
        !helpers.IsSet(process.env.twitter_consumer_secret) ||
        !helpers.IsSet(process.env.twitter_access_token_key) ||
        !helpers.IsSet(process.env.twitter_token_secret)) {
        return false;
    }
    const client = new Twitter({
        consumer_key: process.env.twitter_consumer_key,
        consumer_secret: process.env.twitter_consumer_secret,
        access_token_key: process.env.twitter_access_token_key,
        access_token_secret: process.env.twitter_token_secret,
    });

    // People to follow
    const followers =  'whoismrrobot, samesmail, mrrobotquotes';
    // Associated to channels
    const channels = [
        '#fsociety'
    ] || [];

    const watcher = () => {
        client.stream('user', {
            with: followers
        }, function(stream) {
            stream.on('data', function(tweet) {
                channels.forEach((chan) => {
                    if(helpers.IsSet(tweet.text)) {
                        app.Bot.say(chan, `[Twitter] @${tweet.user.screen_name}: ${tweet.text}`);
                    }
                });
            });
            stream.on('error', function(error) {
                conLogger('Twitter Error: ' + error, 'error');
            });
        });
    };

    app.Registered.set('watcher', {
        call: watcher,
        desc: 'Twitter watcher',
        name: 'TwitterWatcher'
    });
};
