'use strict';
const scriptInfo = {
    name: 'mentions',
    desc: 'Get Last mentions',
    createdBy: 'IronY'
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const Moment = require('moment');

module.exports = app => {
    if (!Models.Mention || !Models.Mentioned) return scriptInfo;

    const mentioned = async (to, from, text, message) => {
        try {
            // Grab the results
            const results = await Models.Mentioned.query(qb => qb
                .where('nick', 'like', from)
                .orderBy('timestamp', 'desc')
                .limit(10)
            )
                .fetchAll({
                    withRelated: ['mention']
                });

            // No Mentions available
            if (!results.length) {
                app.say(to, 'You have no mentions available at this time');
                return;
            }

            // Report back status
            app.say(to,`Sending your last ${results.length} mentions via private message, ${from}`);

            // Report back results
            app.say(from, 'Mentions:');
            _.forEach(results.toJSON(), (result, key) => app.say(
                from,
                `[${key + 1}] - ${Moment(result.timestamp).fromNow()} - By ${result.mention.by} - On ${result.mention.channel}: ${result.mention.text}`
            ));
        }
        catch (err) {
            logger.error('Something went wrong in the mentions script', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong retrieving your mentions ${from}`);
        }
    };

    // Register Mention Command
    app.Commands.set('mentions', {
        desc: 'Get the last 10 mentions',
        access: app.Config.accessLevels.identified,
        call: mentioned
    });

    return scriptInfo;
};
