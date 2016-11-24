'use strict';

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');

module.exports = app => new Promise((resolve, reject) => {
    // Database Not available
    if (!Models.Logging || !Models.Topics) {
        reject(new Error('Database not available'));
        return;
    };
    return Models.Logging
        // Get Results from the logging database
        .query(qb => qb
            .select(['to as channel'])
            .count('to as messages')
            .groupBy('to')
            .orderBy('to')
            .where(clause => {
                let prefixes = _.compact(app.Config.irc.channelPrefixes.split('')) || ['#'];
                clause.where('to', 'like', `${prefixes.shift()}%`);
                _.forEach(prefixes, prefix => clause.orWhere('to', 'like', `${prefix}%`));
            }))
        .fetchAll()
        .then(results => results.toJSON())
        // Format the database results
        .then(channels => {
            let final = {};
            _.forEach(channels, result => {
                final[result.channel] = {
                    messages: result.messages
                };
            });
            return final;
        })
        // Fetch the topics
        .then(channelsObject => {
            // A stack of promises
            let steps = [];
            // Get the title for each channel
            _.forEach(channelsObject, (key, value) => {
                let step = Models.Topics
                    .query(qb => qb
                        .select(['nick', 'topic', 'timestamp'])
                        .where('channel', 'like', value)
                        .orderBy('timestamp', 'desc')
                        .limit(1)
                    ).fetch()
                    .then(subResult => {
                        if (subResult && subResult.attributes && subResult.attributes.topic && subResult.attributes.nick && subResult.attributes.timestamp) {
                            channelsObject[value].topic = {
                                topic: subResult.attributes.topic,
                                by: subResult.attributes.nick,
                                on: subResult.attributes.timestamp
                            }
                        }
                    });
                // Add step to stack
                steps.push(step);
            });
            // Complete all the steps and return result
            return Promise.all(steps).then(() => {
                return channelsObject
            });
        })
        .then(resolve)
        .catch(reject);
});
