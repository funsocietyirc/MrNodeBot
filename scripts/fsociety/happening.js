const scriptInfo = {
    name: 'Happening',
    desc: 'Channel countdowns',
    createdBy: 'IronY',
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const moment = require('../../lib/moment');
const scheduler = require('../../lib/scheduler.js');

// Extend moment with countdown
module.exports = (app) => {
    // No Configuration available, bail
    if (!_.isArray(app.Config.features.countdowns)) return scriptInfo;

    // Hold channel message call backs
    const channelAnnouncements = [];

    // Format Countdown
    const getCountdown = when => moment(when).countdown();

    // Build announcement message
    const getCountdownMessage = countdown => `${countdown.who} ${_.sample(countdown.what)} ${getCountdown(countdown.when).toString()} on ${countdown.where}. `;

    // Check if countdown has already happened
    const isBefore = countdown => moment(countdown.when).isBefore(moment.now());

    // Load an announcement into a schedule
    const scheduleLoader = (key, announcement, countdown, callback) => {
        scheduler.schedule(
            key,
            new scheduler.RecurrenceRule(
                announcement.year,
                announcement.month,
                announcement.date,
                announcement.dayOfWeek,
                announcement.hour,
                announcement.minute,
                announcement.second,
            ), callback,
        );
    };

    /**
     * Extract Twitter Configuration
     * @param {Object} countdown
     */
    const extractTwitter = (countdown) => {
        const hashTags = _.isArray(countdown.why.twitter.hashtags) ? countdown.why.twitter.hashtags : [];

        // Gate
        if (!_.isArray(countdown.why.twitter.announcements)) return;

        // Bind Announcements
        for (const announcement of countdown.why.twitter.announcements) {
            scheduleLoader(`${countdown.who}twitter`, announcement, countdown, () => {
                logger.info(`Scheduled Twitter countdown message for ${countdown.who}`);
                app._twitterClient.post(
                    'statuses/update', { status: `${getCountdownMessage(countdown)} ${hashTags.join(' ')}`.trim() },
                    (err, tweet, response) => {
                        if (err) {
                            logger.error(`Error posting ${countdown.who} to Twitter via countdown script`, {
                                err,
                            });
                            return;
                        }
                        logger.info(`Posting countdown announcement for ${countdown.who} to twitter`);
                    },
                );
            });
        }
    };


    /**
     * Extract IRC Configuration
     * @param {Object} countdown
     */
    const extractIRC = (countdown) => {
        _.each(countdown.why.irc, (v, k) => {
            // Assign Countdown message
            channelAnnouncements.push({
                who: countdown.who,
                when: countdown.when,
                what: countdown.what,
                where: countdown.where,
                channel: k,
            });

            // Gate
            if (!_.isArray(v.announcements)) return;

            _.each(v.announcements, (announcement) => {
                logger.info(`Scheduled countdown message for ${countdown.who} on ${k}`);
                scheduleLoader(countdown.who + k, announcement, countdown, () => {
                    // Not in channel
                    if (!app._ircClient.isInChannel(k) || isBefore(announcement)) return;
                    // Announce
                    app.say(k, getCountdownMessage(countdown).trim());
                });
            });
        });
    };

    /**
     * Process Configuration Object
     * @param {Object[]} countdowns
     */
    const processCountdowns = (countdowns) => {
        if (!_.isArray(countdowns)) return;

        logger.info('Initializing Countdowns');

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

            // The countdown has already happened
            if (isBefore(countdown)) {
                logger.error(`The ${countdown.who} countdown for ${countdown.when} has already occurred and was not loaded`);
                continue;
            }

            logger.info(`Loading Countdown: ${countdown.who}`);

            // Twitter block present / Twitter client exists
            if (app._twitterClient && countdown.why.hasOwnProperty('twitter') && _.isObject(countdown.why.twitter)) extractTwitter(countdown);

            // Irc block present
            if (countdown.why.hasOwnProperty('irc') && _.isObject(countdown.why.irc)) extractIRC(countdown);
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
        _(announcements)
            .filter(x => isBefore)
            .each(announcement => output = getCountdownMessage(announcement) + output);

        app.say(to, output.trim());
    };

    // Register IRC Command
    app.Commands.set('happening', {
        desc: 'Mr. Robot Season 3 countdown',
        access: app.Config.accessLevels.identified,
        call: happening,
    });

    // Expose Script Info
    return Object.assign({}, scriptInfo, {
        onLoad: processCountdowns(app.Config.features.countdowns),
        onUnload: () => channelAnnouncements.splice(0, channelAnnouncements.length),
    });
};
