'use strict';
const scriptInfo = {
    name: 'Announce',
    file: 'announce.js',
    desc: 'Announce to all active channels, and to Twitter',
    createdBy: 'Dave Richer'
};

const conLogger = require('../../lib/consoleLogger');
const pusher = require('../../lib/pusher');

module.exports = app => {
    // Send Announcement Over Pusher
    const pusher = (to, from, text, message, timestamp) => {
        // Load in pusher if it is active
        if (!pusher) {
            return (results);
        }
        pusher.trigger('public', 'announce', {
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
                conLogger('Twitter Error: ' + error, 'error');
                return;
            }
        });
    };

    // Handle IRC Command
    const handler = (to, from, text, message) => {
        const timestamp = Date.now();
        [irc, pusher, twitter].forEach(chan => chan(to, from, text, message, timestamp));
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('announce', {
        desc: '[text] Broadcast announcement',
        access: app.Config.accessLevels.owner,
        call: handler
    });

    return scriptInfo
};
