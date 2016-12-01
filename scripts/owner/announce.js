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
        // Load in pusher if it is active
        if (!pusher) {
            return (results);
        }
        pusherApi.trigger('public', 'announce', {
            to,
            from,
            text,
            timestamp
        });
    };

    // Send Announcement Over IRC
    const irc = (to, from, text, message, timestamp) => {
        if (!app._ircClient || !app.channels.length) {
            return;
        }
        app.channels.forEach(channel => {
            if (channel === to) {
                app.say(channel, 'Your announcement has been made successfully.');
                return;
            };
            app.say(channel, text);
        });
    };

    const twitter = (to, from, text, message) => {
        // Tweet a message
        if (!text) {
            app.say(to, 'Cannot tweet nothing champ...');
            return;
        }
        app._twitterClient.post('statuses/update', {
            status: text
        }, (error, tweet, response) => {
            if (error) {
                logger.error('Twitter Error', {
                    error
                });
                return;
            }
        });
    };

    // Handle IRC Command
    const handler = (to, from, text, message) => {
        const timestamp = Date.now();
        let outputs = [irc];
        if (app.Config.features.twitter.enabled === true) outputs.push(twitter);
        if (app.Config.features.pusher.enabled === true) outputs.push(pusher);
        outputs.forEach(chan => chan(to, from, text, message, timestamp));
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('announce', {
        desc: '[text] Broadcast announcement',
        access: app.Config.accessLevels.owner,
        call: handler
    });

    return scriptInfo
};
