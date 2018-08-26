const scriptInfo = {
    name: 'robotTweet',
    createdBy: 'IronY',
};
const logger = require('../../lib/logger');

module.exports = (app) => {
    if (!app._twitterClient) return scriptInfo;

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

    // Register Tweet Command
    app.Commands.set('tweet', {
        desc: '[message] - Send a message to the Twittersphere',
        access: app.Config.accessLevels.admin,
        call: tweetCmd,
    });

    // Return the script info
    return scriptInfo;
};
