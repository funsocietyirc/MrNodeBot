'use strict';

const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = channel => new Promise((resolve, reject) => {
    // No Database
    if (!Models.Upvote) {
        reject(new Error('Database not available'));
        return;
    };

    // Invalid Arguments
    if (!channel) {
        reject(new Error('channel is a required argument'));
        return;
    }
    // Do a DB Summarization
    Models.Upvote.query(qb => qb
            .select(['candidate'])
            .count('result as votes')
            .sum('result as score')
            .where('channel', 'like', channel)
            .groupBy('candidate')
            .orderBy('result', 'desc')
            .orderBy('votes', 'desc')
        )
        .fetchAll()
        .then(results => {
            // No results
            if (!results.length) {
                resolve({});
                return;
            }
            let scores = results.pluck('score');
            return {
              meanScore:  _.mean(scores).toFixed(2),
              totalScore: _.sum(scores),
              totalVotes: _.sum(results.pluck('votes')),
              rankings: results.toJSON()
            };
        })
        .then(resolve)
        .catch(reject);
});
