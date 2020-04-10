const scriptInfo = {
    name: 'loggingAPI',
    desc: 'Logging API',
    createdBy: 'IronY',
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const moment = require('moment');
const Models = require('funsociety-bookshelf-model-loader');
const hashPattern = new RegExp('%23', 'g');

module.exports = (app) => {
    // Hold on to the Model
    const model = Models.Logging;

    // No Model available, abort
    if (!model) return scriptInfo;

    // Get a list of channels available
    const getLoggingHandler = async (req, res) => {
        const error = {
            status: 'error',
            message: 'No Channel data found',
            results: [],
            total: 0,
        };

        try {
            const date = moment(req.params.date, 'YYYY-MM-DD');

            if (!date.isValid()) {
                return res.json(Object.assign({},error, {
                    message: 'Invalid Date Format'
                }));
            }

            const channel = req.params.channel.replace(hashPattern, '#');
            const page = req.params.page && _.isNumber(_.parseInt(req.params.page)) ? req.params.page : 1;
            const pageSize = 100;
            const enabled = app.Config.features.hasOwnProperty('webLogs') &&
                _.isArray(app.Config.features.webLogs) &&
                app.Config.features.webLogs.includes(channel);

            if (!enabled) {
                return res.json(Object.assign({},error, {
                    message: 'Channel Not Enabled'
                }));
            }

            const results = await model.query(qb => {
                return qb
                    .where('to', channel)
                    .andWhere('timestamp', '>=', date.startOf('day').format("YYYY-MM-DD HH:mm:ss"))
                    .andWhere('timestamp', '<', date.endOf('day').format("YYYY-MM-DD HH:mm:ss"));
            }).fetchPage({
                pageSize,
                page,
            });

            return res.json({
                status: 'success',
                results: results,
                total: results.length,
                rowCount: results.pagination.rowCount,
                pageCount: results.pagination.pageCount,
                page: results.pagination.page,
                pageSize: results.pagination.pageSize,
            });

        } catch (err) {
            logger.error('Something went wrong in the Logging API', {
                message: err.message || '',
                stack: err.stack || '',
            });

            return res.json(Object.assign({},error, {
                message: 'Unhandled Error'
            }));
        }
    };

    app.webRoutes.associateRoute('api.logging', {
        handler: getLoggingHandler,
        desc: 'Logging API',
        path: '/api/log/:channel/:date/:page?',
        verb: 'get',
    });

    return scriptInfo;
};
