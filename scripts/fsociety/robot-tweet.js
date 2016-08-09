'use strict';
const Twitter = require('twitter');
const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');

module.exports = app => {

    // Only load if we have the proper twitter credentials
    if (!app.Config.apiKeys.twitter.consumerKey ||
        !app.Config.apiKeys.twitter.consumerSecret ||
        !app.Config.apiKeys.twitter.tokenKey ||
        !app.Config.apiKeys.twitter.tokenSecret) {
        return false;
    }

    const client = new Twitter({
        consumer_key: app.Config.apiKeys.twitter.consumerKey,
        consumer_secret: app.Config.apiKeys.twitter.consumerSecret,
        access_token_key: app.Config.apiKeys.twitter.tokenKey,
        access_token_secret: app.Config.apiKeys.twitter.tokenSecret,
    });

    const watcher = () => {
        client.stream('user', {
            with: app.Config.features.twitter.followers
        }, function(stream) {
            stream.on('data', function(tweet) {
                app.Config.features.twitter.channels.forEach((chan) => {
                    if (helpers.IsSet(tweet.text)) {
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
