const scriptInfo = {
    name: 'Announce',
    desc: 'Announce to all active channels, and to Twitter',
    createdBy: 'IronY',
};
const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = app => {

    /**
     * Send announcement over socket
     * @param to
     * @param from
     * @param text
     * @param message
     * @param timestamp
     */
    const socket = (to, from, text, message, timestamp) => {
        // Bail if socket client is not available
        if (!app.WebServer.socketIO) return;
        // Send to socket.io
        app.WebServer.socketIO.emit('announce', {
            to,
            from,
            text,
            timestamp,
        });
    };

    /**
     * Send Announcement Over IRC
     * @param to
     * @param from
     * @param text
     */
    const irc = (to, from, text) => {
        // IRC Client does not seem to be available
        if (_.isUndefined(app._ircClient) || !_.isArray(app.channels) || _.isEmpty(app.channels)) return;
        app.channels.forEach((channel) => {
            if (channel === to.toLowerCase()) app.say(channel, 'Your announcement has been made successfully.');
            else app.say(channel, text);
        });
    };

    /**
     * Twitter Handler
     * @param to
     * @param from
     * @param text
     */
    const twitter = (to, from, text) => {
        if (!app._twitterClient) return;
        app._twitterClient.post('statuses/update', {
            status: text,
        }, (err, tweet, response) => {
            if (err) {
                logger.error('Twitter Error', {
                    err,
                });
            }
        });
    };

    /**
     * Announce Handler
     * @param to
     * @param from
     * @param text
     * @param message
     */
    const announceHandler = (to, from, text, message) => {
        // No text provided
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
            app.say(to, `You need to actually provide me with something to announce ${from}`);
            return;
        }
        // Take a timestamp
        const timestamp = Date.now();
        // Push to channels
        _.each([irc, twitter, socket], chan => chan(to, from, text, message, timestamp));
    };
    app.Commands.set('announce', {
        desc: '[text] Broadcast announcement',
        access: app.Config.accessLevels.owner,
        call: announceHandler,
    });

    return scriptInfo;
};
