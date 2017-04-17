'use strict';
const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const getChanPopRank = require('../generators/_getChannelPopularityRanking');
const chanParticipation = require('../lib/_channelParticipation');

module.exports = (app, channel) => new Promise((resolve, reject) => {
  // Database Not available
  if (!Models.Logging || !Models.Topics) {
    reject(new Error('Database not available'));
    return;
  };
  return Models.Logging
    // Get Results from the logging database
    .query(qb => {
      qb
        .select(['to as channel'])
        .count('to as messages')
        .groupBy('to')
        .orderBy('to')
        .where(clause => {
          let prefixes = app._ircClient._getChannelPrefixArray();
          clause.where('to', 'like', `${prefixes.shift()}%`);
          _.forEach(prefixes, prefix => clause.orWhere('to', 'like', `${prefix}%`));
        });
      // Optionally sort on channel
      if (channel) qb.andWhere('to', 'like', channel);
    })
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

      // Iterate through each logged channel
      _.forEach(channelsObject, (key, value) => {
        // Is this channel currently being watched
        channelsObject[value].isWatching = app._ircClient.isInChannel(value, app.nick);
        // Are we an Admin in said channel
        channelsObject[value].isOperator = app._ircClient.isOpInChannel(value, app.nick);
        // Are we voiced in said channel
        channelsObject[value].isVoice = app._ircClient.isVoiceInChannel(value, app.nick);

        // Create topic steps
        steps.push(Models.Topics
          .query(qb => qb
            .select(['nick', 'topic', 'timestamp'])
            .where('channel', 'like', value)
            .orderBy('timestamp', 'desc')
            .limit(1)
          )
          .fetch()
          .then(subResult => {
            if (subResult && subResult.attributes && subResult.attributes.topic && subResult.attributes.nick && subResult.attributes.timestamp) {
              channelsObject[value].topic = {
                topic: subResult.attributes.topic,
                by: subResult.attributes.nick,
                on: subResult.attributes.timestamp
              }
            }
          }));
        // Add the step to get actions count
        steps.push(
          Models.ActionLogging.query(qb => qb.where('to', 'like', value)).count().then(count => {
            channelsObject[value].actions = count || 0;
          })
        );
        // Add the step to get kick count
        steps.push(
          Models.KickLogging.query(qb => qb.where('channel', 'like', value)).count().then(count => {
            channelsObject[value].kicks = count || 0;
          })
        );
        // Get the popularity rankings
        steps.push(
          getChanPopRank(value).then(ranking => {
            if (!_.isEmpty(ranking)) channelsObject[value].popularityRanking = ranking;
          })
        );
        // Get channel participation
        steps.push(
          chanParticipation(value, {
            threshold: 1,
            limit: 10,
          }).then(participation => {
            channelsObject[value].topMonthlyParticipants = participation;
          })
        );

        channelsObject[value].currentParticipants = [];
        channelsObject[value].currentOps = [];
        channelsObject[value].currentVoices = [];

        // Get current participants and seperate them into participants / voices / op
        if (channelsObject[value].isWatching) {
          let users = app._ircClient.getUsers(value);
          _.forEach(users, user => {
            if (app._ircClient.isOpInChannel(value, user)) {
              channelsObject[value].currentOps.push(user);
            } else if (app._ircClient.isVoiceInChannel(value, user)) {
              channelsObject[value].currentVoices.push(user);
            } else {
              channelsObject[value].currentParticipants.push(user);
            }
          })
        }

      });

      // Complete all the steps and return result
      return Promise.all(steps).then(() => {
        return channelsObject
      });
    })
    .then(resolve)
    .catch(reject);
});
