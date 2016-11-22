'use strict';

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const Moment = require('moment');


module.exports = (channel, nick) => new Promise((resolve, reject) => {
    // Database Not available
    if (!Models.Logging) {
        reject(new Error('Database not available'));
        return;
    };
    // Channel Not available
    if (!_.isString(channel) || _.isEmpty(channel)) {
        reject(new Error('Channel name required'));
        return;
    }
    // Normalize Channel
    return Models.Logging.query(qb => {
            qb
                .select([
                    'to as channel',
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%W %M %d %Y") as timestamp'),
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%Y-%m-%d %T") as raw')

                ])
                .count('to as messages')
                .where('to', 'like', channel);
            if (nick) qb.andWhere('from', 'like', nick);
            qb
                .groupBy([
                    Models.Bookshelf.knex.raw('DATE(timestamp)'),
                ]);
        })
        .fetchAll()
        .then(results => {
            let computed = _(results.toJSON());
            resolve({
                results: computed.map(value => {
                    return {
                        channel: value.channel,
                        messages: value.messages,
                        date: value.timestamp,
                        raw: value.raw
                    }
                }).value(),
                lowest: computed.minBy('messages'),
                highest: computed.maxBy('messages'),
            });
        });
});
