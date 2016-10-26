'use strict';
const scriptInfo = {
    name: 'robotTweet',
    file: 'twitter.js',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');
const pusher = require('../../lib/pusher');
const ircTypo = require('../lib/_ircTypography');

let currentStream = null;

module.exports = app => {
    if (!app._twitterClient) {
        return;
    }

    let twitterEnabled = (_.isUndefined(app.Config.features.twitter.enabled) || app.Config.features.twitter.enabled);

    const say = (tweet) => {
        // Announce to Channels
        app.Config.features.twitter.channels.forEach((chan) => {
            if (!twitterEnabled) return;
            app.say(chan, `${ircTypo.logos.twitter} @${tweet.user.screen_name}: ${tweet.text}`);
        });
    };

    const push = (tweet) => {
        if (!twitterEnabled) return;
        // Load in pusher if it is active
        if (!pusher) {
            return;
        }
        let timestamp = Date.now();
        pusher.trigger('public', 'tweets', {
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
        if (!twitterEnabled) return;
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
        if (!twitterEnabled) return;
        if (!text) {
            app.say(from, 'Cannot tweet nothing champ...');
            return;
        }

        let twitConfig = {
            status: text
        };

        app._twitterClient.post('statuses/update', twitConfig, (error, tweet, response) => {
            if (!twitterEnabled) return;
            if (error) {
                conLogger('Twitter Error: ' + error, 'error');
                app.say(from, 'Something is not quite right with your tweet');
                return;
            };
            app.say(from, `We just lit up the Twittersphere Bro!`);
        });
    };


    // Register Listener
    app.OnConnected.set('watcher', {
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
