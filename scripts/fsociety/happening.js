'use strict';
const scriptInfo = {
    name: 'Happening',
    desc: 'Channel countdowns',
    createdBy: 'IronY'
};
const _ = require('lodash');
const moment = require('moment');
const scheduler = require("../../lib/scheduler.js");

// Extend moment with countdown
require('moment-countdown');

const getCountdown = (when) => moment(when).countdown();

module.exports = app => {
    // No Configuration available, bail
    if (!_.isArray(app.Config.features.countdowns)) return scriptInfo;

    // Hold channel message call backs
    const channelAnnouncements = [];

    // Format Countdown
    const getCountdown = (when) => moment(when).countdown();

    // Process countdown objects
    const processCountdowns = (countdowns) => {
        if (!_.isArray(countdowns)) return;

        // Iterate over countdowns
        for (const countdown of countdowns) {

            // Invalid object, bail
            if (
                !_.isObject(countdown) ||
                !_.isString(countdown.who) ||
                !countdown.hasOwnProperty('when') ||
                !_.isArray(countdown.what) ||
                !_.isString(countdown.where) ||
                !_.isObject(countdown.why)
            ) continue;

            // Build announcement message
            const getCountdownMessage = () => `${countdown.who} ${_.sample(countdown.what)} ${getCountdown(countdown.when).toString()} on ${countdown.where}`;

            // Irc block present
            if (countdown.why.hasOwnProperty('irc') && _.isObject(countdown.why.irc)) _.each(countdown.why.irc, (v, k) => {

                // Assign Countdown message
                channelAnnouncements.push({
                    who: countdown.who,
                    when: countdown.when,
                    what: countdown.what,
                    where: countdown.where,
                    channel: k,
                });

                // Bind announcements
                if (_.isArray(v.announcements)) for (const announcement of v.announcements) {
                    scheduler.schedule(countdown.who + k, new scheduler.RecurrenceRule(announcement.year, announcement.month, announcement.date, announcement.dayOfWeek, announcement.hour, announcement.minute, announcement.second), () => {
                        // Not in channel
                        if (!app._ircClient.isInChannel(k)) return;
                        // Announce
                        app.say(k, getCountdownMessage());
                    });
                }

            });
        }
    };

    // Handle the IRC Command
    const happening = (to, from, text, message) => {
        const announcements = _.filter(channelAnnouncements, x => x.channel === to);

        if (!announcements || _.isEmpty(announcements)) {
            app.say(to, `There are currently no countdowns available for ${to}, ${from}`);
            return;
        }

        let output = '';
        _.each(announcements, announcement => {
            output = output + `${announcement.who} ${_.sample(announcement.what)} ${getCountdown(announcement.when)} on ${announcement.where}. `;
        });
        app.say(to, output.trim());
    };

    // IRC Command
    app.Commands.set('happening', {
        desc: 'Mr. Robot Season 3 countdown',
        access: app.Config.accessLevels.identified,
        call: happening
    });

    // Return the script info
    return Object.assign({}, scriptInfo, {
        onLoad: processCountdowns(app.Config.features.countdowns),
        onUnload: () => channelAnnouncements.splice(0, channelAnnouncements.length)
    });
};
