const scriptInfo = {
    name: 'robotTweet',
    createdBy: 'IronY',
};
const logger = require('../../lib/logger');

module.exports = app => {
    if (!app._twitterClient) return scriptInfo;

    /**
     * Tweet Command Handler
     * @param to
     * @param from
     * @param text
     */
    const tweetCmdHandler = (to, from, text) => {
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
        call: tweetCmdHandler,
    });

    // Return the script info
    return scriptInfo;
};
