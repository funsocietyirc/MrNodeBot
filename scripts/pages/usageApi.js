'use strict';
const scriptInfo = {
    name: 'usageApi',
    desc: 'The Usage Express API',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const Moment = require('moment');

module.exports = app => {
    // No Database
    if (!Models.Logging) return;

    const timeFormat = 'MMMM Do YYYY';

    // Get Usage Data over time
    const getUsageOverTime = (req, res) => {
        Models.Logging.query(qb => qb
                .select([
                    'to as channel',
                    'timestamp'
                ])
                .count('to as messages')
                .where('to', 'like', req.params.channel.replace('%23', '#'))
                .groupBy([
                    Models.Bookshelf.knex.raw('DATE(timestamp)'),
                    'to'
                ])
            )
            .fetchAll()
            .then(results => {
                if(!results.length) {
                  res.json({
                    message: 'No results available',
                    status:'error',
                    results:[],
                  });
                  return;
                }
                let computed = _(results.toJSON());
                let final = computed.map(value => {
                    return {
                        channel: value.channel,
                        messages: value.messages,
                        date: Moment(value.timestamp).format(timeFormat),
                    }
                });

                let lowest = computed.minBy('messages');
                lowest.timestamp = Moment(lowest.timestamp).format(timeFormat);
                let highest = computed.maxBy('messages');
                highest.timestamp = Moment(highest.timestamp).format(timeFormat);

                res.json({
                    status: 'success',
                    results: final,
                    lowest,
                    highest,
                });
            })
            .catch(err => {
                logger.error('Error fetching usage stats', {
                    err
                });
                res.json({
                    status: 'error',
                    results: []
                });
            });
    };
    // Subscribe to web service
    app.WebRoutes.set('api.usage.overtime', {
        handler: getUsageOverTime,
        desc: 'Get Usage Over Time',
        path: '/api/usage/overtime/:channel',
        name: 'api.usage.overtime',
        verb: 'get'
    });

    return scriptInfo;
};
