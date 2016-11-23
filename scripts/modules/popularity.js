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

const getPopSent = require('../generators/_getPopularitySentiment');
const getChanPopRank = require('../generators/_getChannelPopularityRanking');
const getCanPopRank = require('../generators/_getCandidatePopularityRanking');

module.exports = app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    // Purge all results for a specified channel
    app.Commands.set('popularity-clear', {
        desc: '[channel] - Remove popularity information for specified channel',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            let channel = text;
            if (!channel) {
                app.say(to, `Please provide me a channel to clear`);
                return;
            }
            Models.Upvote.query(qb => qb
                    .where('channel', 'like', channel)
                )
                .destroy()
                .then(result => app.say(to, `All popularity results for ${channel} have been removed`))
                .catch(err => {
                    logger.error('Error in popularityClear command', {
                        err
                    });
                    app.say(to, `an error has occured with your popularity-clear command`);
                });
        }
    });

    // Purge results for a nick - channel match
    app.Commands.set('popularity-purge', {
        desc: '[nick] [channel] - Remove a users popularity information for specified channel',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            let [nick, channel] = text.split(' ');
            if (!nick || !channel) {
                app.say(to, `Please provide me with both a nick and channel`);
                return;
            }
            Models.Upvote.query(qb => qb
                    .where(q => q
                        .where('voter', 'like', nick)
                        .orWhere('candidate', 'like', nick)
                    )
                    .andWhere('channel', 'like', channel)
                )
                .destroy()
                .then(result => app.say(to, `All popularity results for ${nick} on ${channel} have been removed`))
                .catch(err => {
                    logger.error('Error in pupularityPurge command', {
                        err
                    });
                    app.say(to, `an error has occured with your popularity-clear command`);
                });
        }
    });


    // Find out how a voter feels about a candidate (in optional context to a channel)
    app.Commands.set('popularity-feels', {
        desc: '[voter] [candidate] [channel?] - Get someones feels on someone else',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            let [voter, candidate, channel] = text.split(' ');
            if (!voter || !candidate) {
                app.say(to, `I need more information to properly rate feels`);
                return;
            }
            // Get result from generator, then return
            getPopSent(voter, candidate, channel)
                .then(result => {
                    if (!result) {
                        app.say(to, `${voter} has zero feels for ${candidate} in matters of ${channel}`);
                        return;
                    }

                    let output = `${result.voter} feels ${result.adjective} (${result.score} score) about ${result.candidate}`;
                    if (channel) output = output + ` in matters of ${result.channel}`;
                    output = output + ` (${result.votes} votes)`;
                    app.say(to, output);
                })
                .catch(err => {
                    logger.error('Error in popularityFeels command', {
                        err
                    });
                    app.say(to, `an error has occured with your popularity-feels command`);
                });

        }
    });

    // Get the popularity ranking for a channel
    app.Commands.set('popularity-ranking', {
        desc: '[channel?] - Get popularity ranking for a channel',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            let channel = text || to;
            // Get result from generator then return
            getChanPopRank(channel)
                .then(result => {
                    if (!result) {
                        app.say(to, `There are no popularity statistics for ${channel}`);
                        return;
                    }

                    app.say(to, `The Populairty Rankings have been messaged to you ${from}`);
                    app.say(from, `Popularity Rankings for ${channel}`);
                    _.forEach(result.rankings, (v, k) => app.say(from, `[${k+1}] Candidate: ${v.candidate} Score: ${v.score} Votes: ${v.votes}`));
                    app.say(from, `Mean Score: ${result.meanScore} Total Votes: ${result.totalVotes}`);

                })
                .catch(err => {
                    logger.error('Error in pupularityRaking command', {
                        err
                    });
                    app.say(to, `an error has occured with your popularity-ranking command`);
                });
        }
    });

    // Get the popularity ranking for a user with a optional channel
    app.Commands.set('popularity-contest', {
        desc: '[user?] [channel?] - Get results on popularity',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            let [nick, channel] = text.split(' ');

            // default to current user if no user specified
            nick = nick || from;
            getCanPopRank(nick, channel)
                .then(result => {
                    let inChan = channel ? ` in ${channel}` : '';
                    if (!result) {
                        app.say(to, `There are no results available for ${nick}${inChan}`);
                        return;
                    }
                    app.say(to, `Populairty for candidate ${nick}${inChan} has been messaged to you ${from}`);
                    app.say(from, `Popularity for candidate ${nick}${inChan}`);
                    _.forEach(result.rankings,
                        (value, key) => app.say(from, `[${key+1}] Voter: ${value.voter} Score: ${value.score} Votes: ${value.votes}`)
                    );

                    app.say(from, `Mean Score: ${result.meanScore} Total Votes: ${result.totalVotes}`);
                })
                .catch(err => logger.error('Error in whoLikes', {
                    err
                }));
        }
    });

    // Get a quick popularity summary for a nick with an optional channel
    app.Commands.set('popularity', {
        desc: 'Get a users popularity',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            let [nick, channel] = text.split(' ');
            nick = nick || from;

            getCanPopRank(nick, channel)
                .then(result => {
                    if (!result) {
                        app.say(to, `There is no popularity data for ${nick}`);
                        return;
                    }
                    app.say(to, `Popularity of ${nick} ${channel ? 'On ' + channel : ''} ${typo.icons.sideArrow} ${result.totalVotes} ${typo.icons.views} ${typo.icons.sideArrow} ${result.meanScore} ${result.meanScore > 0 ? typo.icons.happy : typo.icons.sad}`);
                })
                .catch(err => {
                    logger.error('Error in pupularity command', {
                        err
                    });
                    app.say(to, `an error has occured with your popularity command`);
                });
        }
    });

    return scriptInfo;
};
