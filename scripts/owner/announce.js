'use strict';
const scriptInfo = {
    name: 'Announce',
    desc: 'Announce to all active channels, and to Twitter',
    createdBy: 'IronY'
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const pusherApi = require('../../lib/pusher');

module.exports = app => {
    // Send Announcement Over Pusher
    const pusher = (to, from, text, message, timestamp) => {
        // Bail if pusher client is not available
        if (!pusherApi) return;
        // Send to pusher.io
        pusherApi.trigger('public', 'announce', {
            to,
            from,
            text,
            timestamp
        });
    };

    // Send Announcement Over IRC
    const irc = (to, from, text, message, timestamp) => {
        // IRC Client does not seem to be available
        if (_.isUndefined(app._ircClient) || !_.isArray(app.channels) || _.isEmpty(app.channels)) return;
        app.channels.forEach(channel => {
            if (channel == to.toLowerCase()) app.say(channel, 'Your announcement has been made successfully.');
            else app.say(channel, text);
        });
    };

    // Tweet a message
    const twitter = (to, from, text, message, timestamp) => {
        if (!app._twitterClient) return;
        app._twitterClient.post('statuses/update', {
            status: text
        }, (err, tweet, response) => {
            if (err) logger.error('Twitter Error', {
                err
            });
        });
    };

    // Handle IRC Command
    app.Commands.set('announce', {
        desc: '[text] Broadcast announcement',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            // No text provided
            if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
                app.say(to, `You need to actually provide me with something to announce ${from}`);
                return;
            }
            // Take a timestamp
            const timestamp = Date.now();
            // Push to channels
            _.each([irc, twitter, pusher], chan => chan(to, from, text, message, timestamp));
        }
    });

    return scriptInfo;
};
