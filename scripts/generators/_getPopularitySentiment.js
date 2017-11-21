const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = async (voter, candidate, channel) => {
    if (!Models.Upvote) throw new Error('Database not available');
    if (!voter || !candidate) throw new Error('Voter and Candidate arguments are required');

    try {
        // Grab The result
        const result = await Models.Upvote.query((qb) => {
            qb
                .select(['candidate'])
                .sum('result as result')
                .count('result as votes')
                .where('candidate', 'like', candidate)
                .andWhere('voter', 'like', voter)
                .groupBy('candidate')
                .orderBy('result', 'desc');
            if (channel) qb.andWhere('channel', 'like', channel);
        }).fetch();

        // No results
        if (!result) return result;

        const score = result.get('result');
        const votes = result.get('votes');

        // Numerically rank sentiment
        let sentiment = 0;
        let adjective = 'neutral';
        if (score > 0) {
            sentiment = 1;
            adjective = 'good';
        } else if (score < 0) {
            sentiment = -1;
            adjective = 'bad';
        }

        return {
            candidate,
            voter,
            score,
            votes,
            sentiment,
            adjective,
            channel: channel || false,
        };
    } catch (err) {
        logger.error('Something went wrong in _getPopularitySentiment', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw new Error('Something went wrong geting the sentiment');
    }
};
