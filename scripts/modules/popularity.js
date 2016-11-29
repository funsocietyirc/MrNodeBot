'use strict';

const scriptInfo = {
    name: 'Popularity Analytic commands',
    desc: 'Get report data on popularity metrics',
    createdBy: 'IronY'
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
                    app.say(to, `An Error has occured with your popularity-feels command`);
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
                    if (!result || !result.rankings || !result.rankings.length) {
                        app.say(to, `There are no popularity statistics for ${channel}`);
                        return;
                    }

                    app.say(to, `The  Rankings have been messaged to you ${from}`);
                    app.say(from, `Popularity Rankings for ${channel}`);
                    _.forEach(result.rankings, (v, k) => app.say(from, `[${k+1}] Candidate: ${v.candidate} Score: ${v.score} Votes: ${v.votes}`));
                    app.say(from, `Mean Score: ${result.meanScore} Total Score: ${result.totalScore} Total Votes: ${result.totalVotes}`);

                })
                .catch(err => {
                    logger.error('Error in pupularityRaking command', {
                        err
                    });
                    app.say(to, `An Error has occured with your popularity-ranking command`);
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
                    app.say(to, ` for candidate ${nick}${inChan} has been messaged to you ${from}`);
                    app.say(from, `Popularity for candidate ${nick}${inChan}`);
                    _.forEach(result.rankings,
                        (value, key) => app.say(from, `[${key+1}] Voter: ${value.voter} Score: ${value.score} Votes: ${value.votes}`)
                    );

                    app.say(from, `Mean Score: ${result.meanScore} Total Score: ${result.totalScore} Total Votes: ${result.totalVotes}`);
                })
                .catch(err => {
                  logger.error('Error in popularity-contest', {
                      err
                  });
                  app.say(to, `An Error has occured with your popularity-contest command`);
                });
        }
    });

    // Get a quick popularity summary for a nick with an optional channel
    app.Commands.set('popularity', {
        desc: '[nick?] [channel?] Get a users popularity',
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
                    app.say(to, `Popularity of ${nick}${channel ? ' On ' + channel : ''} ${typo.icons.sideArrow} ${result.totalVotes} ${typo.icons.views} ${typo.icons.sideArrow} ${result.meanScore} ${result.meanScore > 0 ? typo.icons.happy : typo.icons.sad}`);
                })
                .catch(err => {
                    logger.error('Error in pupularity command', {
                        err
                    });
                    app.say(to, `An Error has occured with your popularity command`);
                });
        }
    });

    return scriptInfo;
};
