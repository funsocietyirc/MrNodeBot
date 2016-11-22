'use strict';
const scriptInfo = {
    name: 'usageApi',
    desc: 'The Usage Express API',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const Moment = require('moment');
const _ = require('lodash');

module.exports = app => {
    // No Database
    if (!Models.Logging) return;

    // Get Usage Data over time
    const getUsageOverTime = (req, res) => {
        Models.Logging.query(qb => qb
                .select([
                    'to as channel',
                    'timestamp'
                ])
                .count('to as messages')
                .where('to','like',req.params.channel.replace('%23','#'))
                .groupBy([
                  Models.Bookshelf.knex.raw('DATE(timestamp)'),
                  'to'
                ])
            )
            .fetchAll()
            .then(results => {
                let final = _(results.toJSON()).map(value => {
                    return {
                        channel: value.channel,
                        messages: value.messages,
                        date: Moment(value.timestamp).format('MMM Do YY'),
                    }
                });
                res.json({
                  status: 'success',
                  results: final
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
