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
const scheduler = require('../../lib/scheduler');

const {hashPattern} = require('../../helpers');

let cache = [];

module.exports = (app) => {
    // No Database
    if (!Models.Logging) return scriptInfo;

    /**
     * Clear Cache
     */
    const buildCache = async () => {
        cache = await getResults();
        logger.info(`Building Channel Status Cache`);

    };

    // Schedule Recurrence Rule
    scheduler.schedule('clearChannelCache', new scheduler.RecurrenceRule(null, null, null, null, 1, null, null), async () => await buildCache());

    /**
     * In Channels
     * @returns {Promise<{}>}
     */
    const getResults = async () => getUsageChansAvail(app);

    /**
     * On Load build cache
     * @returns {Promise<void>}
     */
    const onLoad = async () => {
        await buildCache();
    };

    /**
     * Channels Available Handler
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const channelsAvailableHandler = async (req, res) => {
        try {
            const results = _.isEmpty(cache) ? (await buildCache()) : cache;

            return res.json({
                status: 'success',
                channels: results,
            });
        } catch (err) {
            logger.error('Error in api.usage.channels.available', {
                message: err.message || '',
                stack: err.stack || '',
            });
            return res.json({
                status: 'error',
            });
        }
    };

    app.webRoutes.associateRoute('api.usage.channels.available', {
        desc: 'Get a list of channels available',
        path: '/api/usage/channels/available/:channel?',
        verb: 'get',
        handler: channelsAvailableHandler,
    });

    /**
     * Usage Over Time
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const usageOverTimeHandler = async (req, res) => {
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
            return res.json(results);
        } catch (err) {
            logger.error('Error fetching usage stats', {
                message: err.message || '',
                stack: err.stack || '',
            });
            return res.json({
                status: 'error',
                results: [],
            });
        }
    };

    app.webRoutes.associateRoute('api.usage.channels.overtime', {
        desc: 'Get Usage Over Time',
        path: '/api/usage/channels/overtime/:channel/:nick?',
        verb: 'get',
        handler: usageOverTimeHandler,
    });
    // Expose Script Info
    return Object.assign({}, scriptInfo, {
        onLoad
    });
};
