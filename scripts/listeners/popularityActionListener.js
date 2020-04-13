const scriptInfo = {
    name: 'Popularity Listener',
    desc: 'Popularity Action listener',
    createdBy: 'IronY',
};
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');

// Primary Logic
// Example IronY gives <nick> a plus or minus +1
module.exports = app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    // Hold timeouts
    const timeouts = new Map();

    // Default Regex matching pattern
    const pattern = (!_.isObject(app.Config.features.popularity) ||
        !_.isString(app.Config.features.popularity.pattern) ||
        _.isEmpty(app.Config.features.popularity.pattern)
    ) ? /gives (\S*)\s+(?:a?\s+)?(\+|-)1(?: (.*))?/ : app.Config.features.popularity.pattern;

    const delayInMins = (!_.isObject(app.Config.features.popularity) ||
        !_.isSafeInteger(app.Config.features.popularity.delayInMins) ||
        app.Config.features.popularity.delayInMins < 0
    ) ? 30 : app.Config.features.popularity.delayInMins;

    const delayInMs = delayInMins * 60 * 1000;

    const cleanJobInMins = (!_.isObject(app.Config.features.popularity) ||
        !_.isSafeInteger(app.Config.features.popularity.cleanJobInMins) ||
        app.Config.features.popularity.cleanJobInMins < 0
    ) ? 30 : app.Config.features.popularity.cleanJobInMins;

    const ignoredChannels = (!_.isObject(app.Config.features.popularity) ||
        !_.isArray(app.Config.features.popularity.ignoredChannels)
    ) ? [] : app.Config.features.popularity.ignoredChannels;

    // Clean empty results periodically
    const clean = scheduler.schedule('clean-upvote-data', {
        minute: cleanJobInMins,
    }, () => {
        logger.info('Cleaning up upvote data');
        // Remove any elements with empty values
        _(timeouts)
            .filter(v => _.isEmpty(v))
            .each((v, k) => timeouts.delete(k));
    });

    const popularity = async (from, to, text, message) => {
        // Ignored channel
        if (_.includes(ignoredChannels, to)) return;

        // See if we get a match
        const result = text.match(pattern);

        // No valid result, or candidate is not in channel, or invalid vote
        if (!result || !result[0] || !result[1] || !result[2]) return;

        // Trying to vote on yourself
        if (result[1] === from) {
            app.say(to, 'It is considered incredibly condescending to cast a vote for yourself');
            return;
        }

        // Users are not in channel
        if (!app._ircClient.isInChannel(to, result[1]) || !app._ircClient.isInChannel(to, from)) {
            app.say(to, `You cannot possibly want to vote for someone who is not present ${from}`);
            return;
        }

        // Timeout gate
        if (timeouts.has(from)) {
            const tmpTimeout = timeouts.get(from);
            if (_.includes(tmpTimeout, result[1])) {
                // TODO: Get the last vote and allow it to be changed
                app.say(to, `Your ${result[2]} vote for ${result[1]} has been rate limited (${delayInMins} min total per candidate)`);
                return;
            }
        } else timeouts.set(from, []);

        try {
            // Create the record
            const record = await Models.Upvote.create({
                candidate: result[1],
                voter: from,
                channel: to,
                result: result[2] === '+' ? 1 : -1,
                text: !_.isUndefined(result[3]) ? result[3] : null,
                host: message.host,
                user: message.user,
            });

            const tmpTimeout = timeouts.get(from);

            if (!_.includes(tmpTimeout, result[1])) {
                tmpTimeout.push(result[1]);
                timeouts.set(from, tmpTimeout);
            }

            // Set timeout to clear the gate
            setTimeout(() => {
                const newTimeout = timeouts.get(from);
                _.pull(newTimeout, result[1]);
                timeouts.set(from, newTimeout);
            }, delayInMs);

            app.say(result[1], `${from} has just given you a ${result[2]} vote on ${to}`);
            app.say(from, `You have just given a ${result[2]} vote to ${result[1]} on ${to}`);
        } catch (err) {
            logger.error('Error in Popularity Listener', {
                message: err.message || '',
                err: err.stack || '',
            });
        }
    };

    // Register with actions
    app.OnAction.set('popularity-listener', {
        desc: 'Provide a Upvote system',
        call: popularity,
    });

    return scriptInfo;
};
