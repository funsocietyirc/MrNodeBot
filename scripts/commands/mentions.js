'use strict';
const scriptInfo = {
    name: 'mentions',
    desc: 'Get Last mentions',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const Moment = require('moment');

module.exports = app => {
    if (!Models.Mention || !Models.Mentioned) return scriptInfo;

    const mentions = (to, from, text, message) => {
        Models.Mentioned.query(qb => qb
                .where('nick', 'like', from)
                .orderBy('timestamp', 'desc')
                .limit(10)
            )
            .fetchAll({
                withRelated: ['mention']
            })
            .then(results => {
                if (!results.length) {
                    app.say(to, 'You have no mentions available at this time');
                    return;
                }
                if (to != from) {
                    app.say(from, `I have sent you your mentions ${to}`);
                }
                app.say(from, `Sending your last ${results.length} mentions`);
                _.forEach(results.toJSON(), (result, key) => app.say(
                    from,
                    `[${key+1}] - ${Moment(result.timestamp).fromNow()} - By ${result.by} - On ${result.channel}: ${result.mention.text}`
                ));
            })
    };

    // Register IMDB Command
    app.Commands.set('mentions', {
        desc: 'Get the last 10 mentions',
        access: app.Config.accessLevels.identified,
        call: mentions
    });

    return scriptInfo;
};
