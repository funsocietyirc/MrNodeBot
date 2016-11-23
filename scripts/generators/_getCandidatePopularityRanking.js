'use strict';

const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = (nick, channel) => new Promise((resolve, reject) => {
    // No Database
    if (!Models.Upvote) {
        reject(new Error('Database not available'));
        return;
    };

    // Invalid Arguments
    if (!nick) {
        reject(new Error('channel is a required argument'));
        return;
    }
    // Do a DB Summarization
    Models.Upvote.query(qb => {
            qb
                .select(['voter'])
                .where('candidate', 'like', nick);

            if (channel) qb.andWhere('channel', 'like', channel);
            qb
                .sum('result as score')
                .count('result as votes')
                .groupBy('voter')
                .orderBy('score', 'desc')
                .orderBy('votes', 'desc');
        })
        .fetchAll()
        .then(results => {
            // No results
            if (!results.length) {
                resolve({});
                return;
            }
            let scores = results.pluck('score');
            return {
                meanScore: _.mean(scores).toFixed(2),
                totalScore: _.sum(scores),
                totalVotes: _.sum(results.pluck('votes')),
                rankings: results.toJSON()
            };
        })
        .then(resolve)
        .catch(reject);
});
