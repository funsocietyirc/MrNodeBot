const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = async (channel) => {
    // Database does not exist
    if (!Models.Upvote) { throw new Error('Database not available'); }

    // Channel not specified
    if (!channel) { throw new Error('Channel is a required argument'); }

    // Fetch the results from the database
    const results = await Models.Upvote.query(qb =>
        qb
            .select(['candidate'])
            .count('result as votes')
            .sum('result as score')
            .where('channel', 'like', channel)
            .groupBy('candidate')
            .orderBy('score', 'desc')
            .orderBy('result', 'desc'))
        .fetchAll();

    // No results, return empty object
    if (!results.length) return {};

    const _results = _(results.toJSON());


    const scores = _results.map(x => parseInt(x.score)).value();

    return {
        meanScore: _.mean(scores).toFixed(2),
        totalScore: _.sum(scores),
        totalVotes: _.sum(results.pluck('votes')),
        rankings: _results.map(x => ({
            candidate: x.candidate,
            score: parseInt(x.score),
            votes: x.votes,
        })).value(),
    };
};
