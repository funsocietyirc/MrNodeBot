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

module.exports = app => {
    // No Database
    if (!Models.Logging) return scriptInfo;

    /**
     * Get the Cache
     * @returns {Promise<*>}
     */
    const getCache = async () => {
        const results = (_.isEmpty(cache) ? (await buildCache()) : cache);
        // Refresh live data
        _.each(results, (x, key) => {
            results[key].isWatching = app._ircClient.isInChannel(key, app.nick);
            results[key].isOperator = app._ircClient.isOpInChannel(key, app.nick);
            results[key].isVoice = app._ircClient.isVoiceInChannel(key, app.nick);
        });
        return results;
    };

    /**
     * Build Cache
     * @returns {Promise<void>}
     */
    const buildCache = async () => {
        try {
            cache = await getUsageChansAvail(app);
            logger.info(`Building Channel Status Cache`);
        } catch (err) {
            logger.error(`Something went wrong building channel cache`, {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };

    // Schedule Recurrence Rule
    scheduler.schedule('clearChannelCache', new scheduler.RecurrenceRule(null, null, null, null, null, 60, null), () => buildCache());

    // Associate On Connected Event
    app.OnConnected.set('channelResults', {
        call: () => buildCache(),
        desc: 'channelResults',
        name: 'channelResults',
    });

    /**
     * Channels Available Handler
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const channelsAvailableHandler = async (req, res) => {
        try {
            const results = await getCache();

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
    return scriptInfo;
};
