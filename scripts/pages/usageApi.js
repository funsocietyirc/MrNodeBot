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

    // Get Usage Data over time
    const getUsageOverTime = (req, res) => {
        Models.Logging.query(qb => qb
                .select([
                    'to as channel',
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%W %M %d %Y") as timestamp'),
                    Models.Bookshelf.knex.raw('DATE_FORMAT(timestamp,"%d %b %Y %T:%f") as raw')

                ])
                .count('to as messages')
                .where('to', 'like', req.params.channel.replace('%23', '#'))
                .groupBy([
                    Models.Bookshelf.knex.raw('DATE(timestamp)'),
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
                res.json({
                    status: 'success',
                    results: computed.map(value => {
                        return {
                            channel: value.channel,
                            messages: value.messages,
                            date: value.timestamp,
                            raw: value.raw
                        }
                    }),
                    lowest: computed.minBy('messages'),
                    highest: computed.maxBy('messages'),
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
