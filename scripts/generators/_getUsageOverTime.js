const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const Moment = require('moment');

const getUsageOverTime = async (channel, nick) => {
    // Database Not available
    if (!Models.Logging) throw new Error('Database not available');

    // Channel Not available
    if (!_.isString(channel) || _.isEmpty(channel)) throw new Error('Channel name required');

    // Grab the Database Results
    const results = await Models.Logging
        .query((qb) => {
            qb
                .select([
                    'to as channel',
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%W %M %d %Y") as timestamp'),
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%Y-%m-%d %T") as raw'),

                ])
                .count('to as messages')
                .where('to', 'like', channel);

            if (nick) qb.andWhere('from', 'like', nick);

            qb
                .groupBy([
                    Models.Bookshelf.knex.raw('DATE(timestamp)'),
                ]);
        })
        .fetchAll();

    // Format them to JSON
    const computed = _(results.toJSON());

    return {
        results: computed.map(value => Object.assign({}, {
            channel: value.channel,
            messages: value.messages,
            date: value.timestamp,
            raw: value.raw,
        })).value(),
        lowest: computed.minBy('messages'),
        highest: computed.maxBy('messages'),
    };
};

module.exports = getUsageOverTime;
