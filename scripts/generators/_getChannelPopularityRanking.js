'use strict';
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = async (channel) => {
    // Database does not exist
    if (!Models.Upvote)
        throw new Error('Database not available');

    // Channel not specified
    if (!channel)
        throw new Error('Channel is a required argument');

    // Fetch the results from the database
    const results = await Models.Upvote.query(qb =>
        qb
            .select(['candidate'])
            .count('result as votes')
            .sum('result as score')
            .where('channel', 'like', channel)
            .groupBy('candidate')
            .orderBy('score', 'desc')
            .orderBy('result', 'desc')
    )
        .fetchAll();

    const finalResults = [];
    _.each(results.toJSON(), x => {
        finalResults.push({
            candidate: x.candidate,
            score: parseInt(x.score),
            votes: parseInt(x.votes),
        });
    });


    console.dir(finalResults);

    // No results, return empty object
    if (!results.length) return {};

    // Hold the scores
    const scores = _.map(finalResults, 'score');

    console.dir(scores);

    return {
        meanScore: parseFloat(_.mean(scores).toFixed(2)),
        totalScore: parseInt(_.sum(scores)),
        totalVotes: _.sum(results.pluck('votes')),
        rankings: finalResults
    };

};
