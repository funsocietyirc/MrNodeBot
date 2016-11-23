'use strict';
const scriptInfo = {
    name: 'popularityUtils',
    desc: 'Popularity Utilities',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');

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
                    app.say(to, `An Error has occured with your popularity-clear command`);
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
                    app.say(to, `An Error has occured with your popularity-clear command`);
                });
        }
    });

    // Return the script info
    return scriptInfo;
};
