'use strict';
const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = (voter, candidate, channel) => new Promise((resolve, reject) => {
  // No Database
  if (!Models.Upvote) {
    reject(new Error('Database not available'));
    return;
  };
  // Invalid Arguments
  if (!voter || !candidate) {
    reject(new Error('voter and candidate arguments are required'));
    return;
  }
  // Do a DB Summarization
  Models.Upvote.query(qb => {
      qb
        .select(['candidate'])
        .sum('result as result')
        .count('result as votes')
        .where('candidate', 'like', candidate)
        .andWhere('voter', 'like', voter)
        .groupBy('candidate')
        .orderBy('result', 'desc');
      if (channel) qb.andWhere('channel', 'like', channel);
    })
    .fetch()
    .then(result => {
      // No results
      if (!result) {
        resolve(result);
        return;
      }

      let score = result.get('result');
      let votes = result.get('votes');

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
        candidate: candidate,
        voter: voter,
        score: score,
        votes: votes,
        sentiment: sentiment,
        adjective: adjective,
        channel: channel || false,
      };
    })
    .then(resolve)
    .catch(reject);
});
