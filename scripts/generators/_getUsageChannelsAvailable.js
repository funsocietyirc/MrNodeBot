const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const getChanPopRank = require('../generators/_getChannelPopularityRanking');
const chanParticipation = require('../lib/_channelParticipation');


/**
 * Get Results
 * @param app
 * @param channel
 * @returns {Promise<{}>}
 */
const getResults = async (app, channel) => {
    // Database Not available
    if (!Models.Logging || !Models.Topics) {
        throw new Error('Database is not available');
    }

    const query = (qb) => {
        qb
            .select(['to as channel'])
            .count('to as messages')
            .groupBy('to')
            .orderBy('to')
            .where((clause) => {
                const prefixes = app._ircClient._getChannelPrefixArray();
                clause.where('to', 'like', `${prefixes.shift()}%`);
                for (const prefix of prefixes) {
                    clause.orWhere('to', 'like', `${prefix}%`);
                }
            });
        // Optionally sort on channel
        if (channel) qb.andWhere('to', 'like', channel);
    };

    const results = await Models.Logging.query(query).fetchAll();

    const channels = await results.toJSON();

    const final = {};

    for (const result of channels) {
        final[result.channel] = {
            messages: result.messages,
        };
    }

    // Iterate through each logged channel
    for (const [value, key] of Object.entries(final)) {
        // Is this channel currently being watched
        final[value].isWatching = app._ircClient.isInChannel(value, app.nick);
        // Are we an Admin in said channel
        final[value].isOperator = app._ircClient.isOpInChannel(value, app.nick);
        // Are we voiced in said channel
        final[value].isVoice = app._ircClient.isVoiceInChannel(value, app.nick);

        // Set sub results
        const subResult = await Models.Topics
            .query(qb => qb
                .select(['nick', 'topic', 'timestamp'])
                .where('channel', 'like', value)
                .orderBy('timestamp', 'desc')
                .limit(1)
            )
            .fetch();
        if (subResult && subResult.attributes && subResult.attributes.topic && subResult.attributes.nick && subResult.attributes.timestamp) {
            final[value].topic = {
                topic: subResult.attributes.topic,
                by: subResult.attributes.nick,
                on: subResult.attributes.timestamp,
            };
        }

        // Set Action count
        const actionCount = await Models.ActionLogging.query(qb => qb.where('to', 'like', value)).count();
        final[value].actions = actionCount || 0;

        // Set Kick Count
        const kickCount = await Models.KickLogging.query(qb => qb.where('channel', 'like', value)).count();
        final[value].kicks = kickCount || 0;

        // Set Ranking
        const ranking = await getChanPopRank(value);
        if (!_.isEmpty(ranking)) final[value].popularityRanking = ranking;

        // Set Participation
        final[value].topMonthlyParticipants = await chanParticipation(value, {
            threshold: 1,
            limit: 10,
        });

        // Set Defaults
        final[value].currentParticipants = [];
        final[value].currentOps = [];
        final[value].currentVoices = [];

        // Get current participants and separate them into participants / voices / op
        if (final[value].isWatching) {
            for (const user of app._ircClient.getUsers(value)) {
                if (app._ircClient.isOpInChannel(value, user)) {
                    final[value].currentOps.push(user);
                } else if (app._ircClient.isVoiceInChannel(value, user)) {
                    final[value].currentVoices.push(user);
                } else {
                    final[value].currentParticipants.push(user);
                }
            }
        }
    }

    // Complete all the steps and return result
    return final;
};

module.exports = getResults;
