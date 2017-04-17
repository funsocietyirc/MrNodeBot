'use strict';
const scriptInfo = {
  name: 'robotTweet',
  createdBy: 'IronY'
};
const _ = require('lodash');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const pusher = require('../../lib/pusher');
const ircTypo = require('../lib/_ircTypography');
const short = require('../generators/_isGdShortUrl');
const tweetStreamUrl = 'https://twitter.com/funsocietyirc/status';
// https://twitter.com/funsocietyirc/status/796592786782949380
let currentStream = null;

module.exports = app => {
  if (!app._twitterClient) return scriptInfo;

  // Announce to Channels
  const say = (tweet, shortUrl) =>
    app.Config.features.twitter.channels.forEach((chan) => {
      app.say(chan, `${ircTypo.logos.twitter} ${ircTypo.icons.sideArrow} ${shortUrl} ${ircTypo.icons.sideArrow} @${tweet.user.screen_name} ${ircTypo.icons.sideArrow} ${tweet.text}`);
    });

  const push = (tweet) => {
    if (!app._twitterClient || !pusher) return;

    let timestamp = Date.now();

    pusher.trigger('public', 'tweets', {
      tweet,
      timestamp
    });
  };

  const onTweetData = tweet => {
    // We do not have enought data, bail
    if (!tweet.user || !tweet.text) return;

    short(`${tweetStreamUrl}/${tweet.id_str}`)
      .then(shortUrl => [say, push].forEach(medium => medium(tweet, shortUrl)));
  };

  const onTweetError = error => logger.error('Twitter Error', {
    error
  });

  // the Main twitter watcher
  const watcher = () => {
    if (!app._twitterClient) return;

    let newStream = app._twitterClient.stream('user', {
      with: app.Config.features.twitter.followers
    });

    newStream.once('connected', function(res) {
      if (currentStream) currentStream.stop();

      newStream.on('tweet', onTweetData);
      newStream.on('error', onTweetError);

      currentStream = newStream;
    });
  };

  // Tweet a message
  const tweetCmd = (to, from, text, message) => {
    if (!app._twitterClient) return;

    if (!text) {
      app.say(to, 'Cannot tweet nothing champ...');
      return;
    }

    let twitConfig = {
      status: text
    };

    app._twitterClient.post('statuses/update', twitConfig, (error, tweet, response) => {
      if (error) {
        logger.error('Twitter Error', {
          error
        });
        app.say(to, 'Something is not quite right with your tweet');
        return;
      };
      app.say(to, `We just lit up the Twittersphere Bro!`);
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
