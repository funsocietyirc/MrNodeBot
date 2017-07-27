'use strict';
const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = async (nick, channel) => {
    // No Database
    if (!Models.Upvote) throw new Error('Database not available');
    // Invalid Arguments
    if (!nick) throw new Error('Channel is a required argument');

    try {
        const results = await Models.Upvote.query(qb => {
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
        }).fetchAll();

        // No results
        if (!results.length) return {};

        const scores = results.pluck('score');

        return {
            meanScore: _.mean(scores).toFixed(2),
            totalScore: _.sum(scores),
            totalVotes: _.sum(results.pluck('votes')),
            rankings: results.toJSON()
        };
    }
    catch (err) {
        logger.error('Something went wrong in the _getCandidatePopularityRanking file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw new Error('Something went wrong getting the ranking');
    }
};
