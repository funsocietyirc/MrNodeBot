const scriptInfo = {
    name: 'robotTweet',
    createdBy: 'IronY',
};
const _ = require('lodash');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const ircTypo = require('../lib/_ircTypography');
const short = require('../lib/_getShortService')();

const tweetStreamUrl = 'https://twitter.com/funsocietyirc/status';
let currentStream = null;

module.exports = (app) => {
    if (!app._twitterClient) return scriptInfo;

    // Announce to Channels
    const say = (tweet, shortUrl) =>
        app.Config.features.twitter.channels.forEach((chan) => {
            app.say(chan, `${ircTypo.logos.twitter} ${ircTypo.icons.sideArrow} ${shortUrl} ${ircTypo.icons.sideArrow} @${tweet.user.screen_name} ${ircTypo.icons.sideArrow} ${tweet.text}`);
        });

    // Push to Socket
    const push = (tweet) => {
        if (!app._twitterClient || !app.WebServer.socketIO) return;

        const timestamp = Date.now();

        app.WebServer.socketIO.emit('tweets', {
            tweet,
            timestamp,
        });
    };

    const onTweetData = (tweet) => {
        // We do not have enough data, bail
        if (!tweet.user || !tweet.text) return;

        short(`${tweetStreamUrl}/${tweet.id_str}`)
            .then(shortUrl => [say, push].forEach(medium => medium(tweet, shortUrl)));
    };

    const onTweetError = error => logger.error('Twitter Error', {
        error,
    });

    // the Main twitter watcher
    // const watcher = () => {
    //     if (!app._twitterClient) return;
    //
    //     const newStream = app._twitterClient.stream('user', {
    //         with: app.Config.features.twitter.followers,
    //     });
    //
    //     newStream.once('connected', (res) => {
    //         if (currentStream) currentStream.stop();
    //
    //         // Fire off the listeners, being sure to clear the previous
    //         // as to not overload on script reload
    //         newStream.removeAllListeners('tweet');
    //         newStream.on('tweet', onTweetData);
    //         newStream.removeAllListeners('error');
    //         newStream.on('error', onTweetError);
    //
    //         currentStream = newStream;
    //     });
    // };
    // TODO Find a way ti reimplement
    const watcher = () => {
        logger.warn('Twitter has closed its public streaming API, we are re-evaluating this feature');
    };

    // Tweet a message
    const tweetCmd = (to, from, text, message) => {
        if (!app._twitterClient) return;

        if (!text) {
            app.say(to, 'Cannot tweet nothing, champ...');
            return;
        }

        const twitConfig = {
            status: text,
        };

        app._twitterClient.post('statuses/update', twitConfig, (error, tweet, response) => {
            if (error) {
                logger.error('Twitter Error', {
                    error,
                });
                app.say(to, 'Something is not quite right with your tweet');
                return;
            }
            app.say(to, 'We\'ve just lit up the Twittersphere, bro!');
        });
    };


    // Register Listener
    app.OnConnected.set('watcher', {
        call: watcher,
        desc: 'Twitter watcher',
        name: 'TwitterWatcher',
    });

    // Register Tweet Command
    app.Commands.set('tweet', {
        desc: '[message] - Send a message to the Twittersphere',
        access: app.Config.accessLevels.admin,
        call: tweetCmd,
    });

    // Return the script info
    return scriptInfo;
};
