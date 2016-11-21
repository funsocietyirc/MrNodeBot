'use strict';

const scriptInfo = {
    name: 'Popularity Analytic commands',
    desc: 'Get report data on popularity metrics',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');

module.exports = app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    const popularityFeels = (to, from, text, message) => {
        let [voter, candidate, channel] = text.split(' ');
        if (!voter || !candidate) {
            app.say(to, `I need more information to properly rate feels`);
            return;
        }

        // Set current channel if we have none specified
        channel = channel || to;

        Models.Upvote.query(qb => qb
                .select(['candidate'])
                .sum('result as result')
                .count('result as votes')
                .where('candidate', 'like', candidate)
                .andWhere('voter', 'like', voter)
                .andWhere('channel', 'like', channel)
                .groupBy('candidate')
                .orderBy('result', 'desc')
            )
            .fetch()
            .then(result => {
              if(!result) {
                app.say(to, `${voter} has zero feels for ${candidate} in matters of ${channel}`);
                return;
              }
              let status = result.get('result') > 0 ? true : false;
              app.say(to, `${voter} feels ${status ? 'good' : 'bad'} (${result.get('result')}) about ${candidate} in matters of ${channel} (${result.get('votes')})`);
            })
            .catch(err => console.dir(err));
    };
    app.Commands.set('feels', {
        desc: '[voter] [candidate] [channel?] - Get someones feels on someone else',
        access: app.Config.accessLevels.identified,
        call: popularityFeels
    });


    const popularityRanking = (to, from, text, message) => {
        let channel = text || to;
        Models.Upvote.query(qb => qb
                .select(['candidate'])
                .count('result as votes')
                .sum('result as result')
                .where('channel', 'like', channel)
                .groupBy('candidate')
                .orderBy('result', 'desc')
            )
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, `There are no popularity statistics for ${channel}`);
                    return;
                }
                app.say(to, `The Populairty Rankings have been messaged to you ${from}`);
                app.say(from, `Popularity Rankings for ${channel}`);
                results.forEach((v, k) => app.say(from, `[${k+1}] Candidate: ${v.attributes.candidate} Score: ${v.attributes.result} Votes: ${v.attributes.votes}`));
            })
            .catch(err => logger.error('Error in popularityRanking', {
                err
            }));
    };
    app.Commands.set('popularity-ranking', {
        desc: '[channel?] - Get popularity ranking for a channel',
        access: app.Config.accessLevels.identified,
        call: popularityRanking
    });

    const popularityContest = (to, from, text, message) => {
        let [nick, channel] = text.split(' ');

        // default to current user if no user specified
        nick = nick || from;
        channel = channel || to;

        Models.Upvote.query(qb => qb
                .where('candidate', 'like', nick)
                .andWhere('channel', 'like', channel)
            )
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, `There are no results available for ${nick} in ${channel}`);
                    return;
                }
                let computed = _(results.toJSON());

                // Get a list of voters
                let voters = computed.map('voter').uniq().value();
                let finalResults = [];
                _.forEach(voters, (voter, key) => {
                    let computedVoter = computed.filter(f => f.voter == voter);
                    finalResults.push({
                        voter,
                        total: computedVoter.sumBy('result'),
                        votes: computedVoter.value().length
                    });
                });
                app.say(to, `Popularity for candidate ${nick} on ${channel}`);
                _(finalResults).orderBy(['total', 'votes'], ['desc', 'desc']).forEach((value, key) => app.say(to, `[${key+1}] Voter: ${value.voter} Score: ${value.total} Votes: ${value.votes}`));
                app.say(to, `Total Score: ${computed.sumBy('result')} Total Votes: ${computed.value().length}`);
            })
            .catch(err => logger.error('Error in whoLikes', {
                err
            }));
    };
    app.Commands.set('popularity-contest', {
        desc: '[user?] [channel?] - Get results on popularity',
        access: app.Config.accessLevels.identified,
        call: popularityContest
    });

    // Get the total populairty of a user
    const popularity = (to, from, text, message) => {
        let [nick, channel] = text.split(' ');
        nick = nick || from;
        channel = channel || to;

        Models.Upvote.query(qb => {
                qb.where('candidate', 'like', nick);
                if (channel) {
                    qb.andWhere('channel', 'like', channel);
                }
            })
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, `There is no popularity data for ${nick}`);
                    return;
                }
                let total = _(results.pluck('result')).sum();

                app.say(to, `Popularity of ${nick} ${channel ? 'On ' + channel : ''} ${typo.icons.sideArrow} ${results.length} ${typo.icons.views} ${typo.icons.sideArrow} ${total} ${total > 0 ? typo.icons.happy : typo.icons.sad}`);
            })
            .catch(err => logger.err('Error fetching record', {
                err
            }));
    };
    app.Commands.set('popularity', {
        desc: 'Get a users popularity',
        access: app.Config.accessLevels.identified,
        call: popularity
    });

    return scriptInfo;
};
