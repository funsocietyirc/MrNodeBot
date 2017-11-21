// TODO This does not work in sqlite
// Returns a promise with Channel participation statistics.
// Requires: The channel to get statistics for, and a optional options object
// Example output:
// [
//   { nick: 'IronY', total: 15884 },
//   { nick: 'Zhenn', total: 1259 }
// ]
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const moment = require('moment');
const logger = require('../../lib/logger');

const defaultUsageOptions = {
    timeUnit: 1, // Numeric Time  measurement
    timeMeasure: 'months', // String Time Unit, (Moment.js)
    timeOperator: '>=', // Operator to compare time elements
    nicks: [], // Nicks to filter on
    uniqueText: false, // Only count unique lines,
    threshold: null, // Only return nicks that have this many lines
    limit: null, // Only take this many lines
    contains: '', // Only count lines that contain this text
    timestampFormat: 'YYYY-MM-DD HH:mm:ss', // Timestamp format
};

const channelParticipation = async (channel, options) => {
    // No Database available
    if (!Models.Logging) throw new Error('No database connectivity available');

    // No Channel provided
    if (!_.isString(channel) || _.isEmpty(channel)) throw new Error('No channel provided');

    // Defaults
    options = _.isObject(options) ? _.defaultsDeep(options, defaultUsageOptions, {
        compiledTime: moment()
            .subtract(defaultUsageOptions.timeUnit, defaultUsageOptions.timeMeasure)
            .format(defaultUsageOptions.timestampFormat),
    }) : defaultUsageOptions;

    try {
        const models = await Models.Logging.query((qb) => {
            // Start the query
            qb
                .select([
                    'from as nick',
                    Models.Bookshelf.knex.raw(`count(${options.uniqueText ? 'DISTINCT(text)' : 'text'}) as total`),
                ])
                .where((clause) => {
                    // Filter on channel
                    clause.where('to', 'like', channel);

                    // Filter on text
                    if (_.isString(options.contains) && !_.isEmpty(options.contains)) clause.andWhere('text', 'like', `%${options.contains}%`);

                    // Filter on timeUnit
                    clause.andWhere('timestamp', options.timeOperator, options.compiledTime);
                })
                .andWhere((clause) => {
                    // If we have been given a non-empty array of nicks
                    if (_.isArray(options.nicks) && options.nicks.length) {
                        clause.where('from', 'like', options.nicks.shift());
                        _.each(options.nicks, nick => clause.orWhere('from', 'like', nick));
                    }
                })
                .groupBy('nick')
                .orderBy('total', 'desc');

            // Optional Limit
            if (!_.isNull(options.limit) && !isNaN(options.limit)) qb.limit(options.limit);
        })
            .fetchAll();

        let results = models.toJSON();

        // Filter results
        if (!_.isNull(options.threshold) && !isNaN(options.threshold)) results = _.filter(results, r => r.total >= options.threshold);
        return results;
    } catch (err) {
        logger.error('DB Error in getChannelUsage', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = channelParticipation;
