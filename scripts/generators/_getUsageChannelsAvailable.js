'use strict';

const _ = require('lodash');
const logger = require('../../lib/logger');
const config = require('../../config');
const Models = require('bookshelf-model-loader');


module.exports = () => new Promise((resolve, reject) => {
    // Database Not available
    if (!Models.Logging) {
        reject(new Error('Database not available'));
        return;
    };

    return Models.Logging.query(qb => qb
            .select(['to as channel'])
            .distinct('to')
            .orderBy('to')
            .where(clause => {
                let prefixes = _.compact(config.irc.channelPrefixes.split('')) || ['#'];
                clause.where('to', 'like', `${prefixes.shift()}%`);
                _.forEach(prefixes, prefix => clause.orWhere('to', 'like', `${prefix}%`));
            }))
        .fetchAll()
        .then(results => resolve(results.pluck('channel')))
        .catch(reject);
});
