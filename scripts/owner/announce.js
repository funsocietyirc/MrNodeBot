'use strict';
const scriptInfo = {
    name: 'Announce',
    file: 'announce.js',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    // Send Announcement Over Pusher
    const pusher = (to, from, text, message, timestamp) => {
        // Load in pusher if it is active
        if (!app.Config.pusher.enabled && !app._pusher) {
            resolve(results);
        }
        app._pusher.trigger('public', 'announce', {
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
            app.say(channel, `Announcement From ${from}: ${text}`);
        });
    };


    // Handle IRC Command
    const handler = (to, from, text, message) => {
        const timestamp = Date.now();
        [irc, pusher].forEach(chan => chan(to,from,text,message,timestamp));
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('announce', {
        desc: '[text] Broadcase announcement',
        access: app.Config.accessLevels.owner,
        call: handler
    });

    return scriptInfo
};
