'use strict'

/**
  Returns a promise with Channel participation statistics.
  Requires: The channel to get statistics for, and a optional options object
  Example output:
  [
    { nick: 'IronY', total: 15884 },
    { nick: 'Zhenn', total: 1259 }
  ]
**/

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const moment = require('moment');

const defaultUsageOptions = {
    timeUnit: 1, // Numberic Time  measurement
    timeMeasure: 'months', // String Time Unit, (Moment.js)
    nicks: [], // Nicks to filter on
    uniqueText: false, // Only count unique lines,
    threshold: null, // Only return nicks that have this many lines
    limit: null, // Only take this many lines
    contains: '', // Only count lines that contain this text
};

module.exports = (channel, options) => new Promise((resolve, reject) => {
    if (!Models.Logging) {
        reject(new Error('No database connectivty available'));
        return;
    } else if (!_.isString(channel)) {
        reject(new Error('No channel provided'));
        return;
    }

    // Normalize Options
    options = _.isObject(options) ? _.defaultsDeep(options, defaultUsageOptions) : defaultUsageOptions;

    // Query
    Models.Logging.query(qb => {
            qb
                .select([
                    'from as nick',
                    Models.Bookshelf.knex.raw(`count(${options.uniqueText ? 'DISTINCT(text)' : 'text'}) as total`)
                ])
                .where(clause => {
                    // Filter on channel
                    clause.where('to', 'like', channel);
                    // Filter on text
                    if(_.isString(options.contains) && !_.isEmpty(options.contains)) {
                      clause.andWhere('text','like', `%${options.contains}%`);
                    }
                    // Filter on timeUnit
                    clause.andWhere('timestamp', '>=', moment().subtract(options.timeUnit, options.timeMeasure).format('YYYY-MM-DD HH:mm:ss'));
                })
                .andWhere(clause => {
                  // If we have been given a non empty array of nicks
                  if (_.isArray(options.nicks) && options.nicks.length) {
                      clause.where('from','like',options.nicks.shift());
                      _.each(options.nicks, nick => clause.orWhere('from', 'like', nick));
                  }
                })
                .groupBy('nick')
                .orderBy('total', 'desc');
                // Optional Limit
                if(!_.isNull(options.limit) && !isNaN(options.limit)) {
                  qb.limit(options.limit);
                }
        })
        .fetchAll()
        .then(models => {
            let results = models.toJSON();
            if (!_.isNull(options.threshold) && !isNaN(options.threshold)) {
                results = _.filter(results, r => r.total >= options.threshold);
            }
            resolve(results);
        })
        .catch(err => {
            console.log('DB Error in getChannelUsage');
            console.dir(err);
            reject(new Error('A database error occured'));
        });
});
