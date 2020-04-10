const scriptInfo = {
    name: 'usageApi',
    desc: 'The Usage Express API',
    createdBy: 'IronY',
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const getUsageOverTime = require('../generators/_getUsageOverTime');
const getUsageChansAvail = require('../generators/_getUsageChannelsAvailable');

const hashPattern = new RegExp('%23', 'g');

module.exports = (app) => {
    // No Database
    if (!Models.Logging) return scriptInfo;

    // Provide a list of channels we have logging information on
    app.webRoutes.associateRoute('api.usage.channels.available', {
        desc: 'Get a list of channels available',
        path: '/api/usage/channels/available/:channel?',
        verb: 'get',
        handler: (req, res) => {
            const channel = req.params.channel && _.isString(req.params.channel) ? req.params.channel.replace(hashPattern, '#') : null;
            getUsageChansAvail(app, channel)
                .then(results =>
                    res.json({
                        status: 'success',
                        channels: results,
                    }))
                .catch((err) => {
                    logger.error('Error in api.usage.channels.available', {
                        err,
                    });
                    res.json({
                        status: 'error',
                    });
                });
        },
    });

    // Subscribe to web service
    app.webRoutes.associateRoute('api.usage.channels.overtime', {
        desc: 'Get Usage Over Time',
        path: '/api/usage/channels/overtime/:channel/:nick?',
        verb: 'get',
        handler: async (req, res) => {
            try {
                const results = await getUsageOverTime(req.params.channel.replace(hashPattern, '#'), req.params.nick);
                // No Results available
                if (!results) {
                    return res.json({
                        message: 'No results available',
                        status: 'error',
                        results: [],
                    });
                }

                results.status = 'success';
                res.json(results);
            } catch (err) {
                logger.error('Error fetching usage stats', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
                res.json({
                    status: 'error',
                    results: [],
                });
            }
        },
    });

    return scriptInfo;
};
