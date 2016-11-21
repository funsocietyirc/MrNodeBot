'use strict';

const scriptInfo = {
    name: 'Image Utilitie Module',
    desc: 'Tools to remove all images from the url table, rebuild them, and them should they die',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');

module.exports = app => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    const popularityContest = (to, from, text, message) => {
        let [nick, channel] = text.split(' ');

        // default to current user if no user specified
        nick = nick || from;
        channel = channel || to;


        Models.Upvote.query(qb => qb
                .select()
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

                app.say(to, `Popularity Contest for ${nick} on ${channel}`);

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
                _(finalResults).sortBy('total', 'asc').forEach((value, key) => {
                  app.say(to, `[${key+1}] Candidate: ${value.voter} Score: ${value.total} Votes: ${value.votes}`);
                });
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
        // No nick available
        if (!nick) {
            app.say(to, `Could you possibly give me someone to rate?`);
            return;
        }

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

                app.say(to, `Popularity ${channel ? 'On ' + channel : ''} ${typo.icons.sideArrow} ${results.length} ${typo.icons.views} ${typo.icons.sideArrow} ${total} ${total > 0 ? typo.icons.happy : typo.icons.sad}`);
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
