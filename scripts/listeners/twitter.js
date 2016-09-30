'use strict';
const scriptInfo = {
    name: 'robotTweet',
    file: 'twitter.js',
    createdBy: 'Dave Richer'
};

const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');
module.exports = app => {
    if(!app._twitterClient) {
      return;
    }
    console.log(app._twitterClient);
    const formatTweet = tweet => tweet ? `[Twitter] @${tweet.user.screen_name}: ${tweet.text}` : '';

    const say = (chan, tweet) => {
        // Announce to Channels
        app.Config.features.twitter.channels.forEach((chan) => {
              app.say(chan, formatTweet(tweet));
        });
    };

    const push = (tweet) => {
      // Load in pusher if it is active
      if (!app.Config.pusher.enabled && !app._pusher) {
          resolve(results);
      }
      let timestamp = Date.now();
      app._pusher.trigger('public', 'tweets', {
        tweet: formatTweet(tweet),
        timestamp
      });
    };

    const watcher = () => {
        app._twitterClient.stream('user', {
                with: app.Config.features.twitter.followers
            },
            function(stream) {
                stream.on('data', function(tweet) {
                    [say,push].forEach(medium => medium(tweet));
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

    // Return the script info
    return scriptInfo;
};
