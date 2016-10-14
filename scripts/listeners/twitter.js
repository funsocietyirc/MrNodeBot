'use strict';
const scriptInfo = {
    name: 'robotTweet',
    file: 'twitter.js',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');
let currentStream = null;

module.exports = app => {
    if (!app._twitterClient) {
        return;
    }

    const say = (tweet) => {
        // Announce to Channels
        app.Config.features.twitter.channels.forEach((chan) => {
            app.say(chan, `[Twitter] @${tweet.user.screen_name}: ${tweet.text}`);
        });
    };

    const push = (tweet) => {
        // Load in pusher if it is active
        if (!app.Config.pusher.enabled && !app._pusher) {
            return;
        }
        let timestamp = Date.now();
        app._pusher.trigger('public', 'tweets', {
            tweet,
            timestamp
        });
    };

    const onTweetData = tweet => {
        // If we have enough information to report back
        if (tweet.user || tweet.text) {
            [say, push].forEach(medium => medium(tweet));
        }
    };

    const onTweetError = error => {
        conLogger('Twitter Error: ' + error, 'error');
    };

    // the Main twitter watcher
    const watcher = () => {
        let newStream = app._twitterClient.stream('user', {
            with: app.Config.features.twitter.followers
        });

        newStream.once('connected', function(res) {
            if (currentStream) {
                currentStream.stop();
            }
            newStream.on('tweet', onTweetData);
            newStream.on('error', onTweetError);
            currentStream = newStream;
        });
    };

    // Tweet a message
    const tweetCmd = (to, from, text, message) => {
        if (!text) {
            app.say(from, 'Cannot tweet nothing champ...');
            return;
        }

        let twitConfig = {
            status: text
        };

        app._twitterClient.post('statuses/update', twitConfig, (error, tweet, response) => {
            if (error) {
                conLogger('Twitter Error: ' + error, 'error');
                app.say(from, 'Something is not quite right with your tweet');
                return;
            };
            app.say(from, `We just lit up the Twittersphere Bro!`);
        });
    };


    // Register Listener
    app.Registered.set('watcher', {
        call: watcher,
        desc: 'Twitter watcher',
        name: 'TwitterWatcher'
    });

    // Register Tweet Command
    app.Commands.set('tweet', {
        desc: '[message] - Send a message to the Twittersphere',
        access: app.Config.accessLevels.admin,
        call: tweetCmd
    });

    // Return the script info
    return scriptInfo;
};
