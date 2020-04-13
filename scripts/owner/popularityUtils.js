const scriptInfo = {
    name: 'popularityUtils',
    desc: 'Popularity Utilities',
    createdBy: 'IronY',
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = app => {
    // Database not available
    if (!Models.Upvote) { return scriptInfo; }

    // Purge all results for a specified channel
    const popularityClear = async (to, from, channel, message) => {
        // No Channel Given
        if (!channel) {
            app.say(to, 'Please provide me a channel to clear');
            return;
        }

        // Attempt
        try {
            const result = await Models.Upvote.query(qb => qb.where('channel', 'like', channel)).destroy();
            app.say(to, `All popularity results for ${channel} have been removed`);
        } catch (err) {
            logger.error('Error in popularityClear command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'An Error has occurred with your popularity-clear command');
        }
    };
    // Bind purge command
    app.Commands.set('popularity-clear', {
        desc: '[channel] - Remove popularity information for specified channel',
        access: app.Config.accessLevels.owner,
        call: popularityClear,
    });

    // Purge results for a nick - channel match
    const popularityPurge = async (to, from, text, message) => {
        // Seperate Input
        const [nick, channel] = text.split(' ');

        // Validate Input
        if (!nick || !channel) {
            app.say(to, 'Please provide me with both a Nick and Channel');
            return;
        }

        // Attempt
        try {
            const result = await Models.Upvote.query(qb => qb.where(q => q.where('voter', 'like', nick).orWhere('candidate', 'like', nick)).andWhere('channel', 'like', channel)).destroy();
            app.say(to, `All popularity results for ${nick} on ${channel} have been removed`);
        } catch (err) {
            logger.error('Error in popularityPurge command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'An Error has occurred with your popularity-clear command');
        }
    };

    // Bind Command
    app.Commands.set('popularity-purge', {
        desc: '[nick] [channel] - Remove a users popularity information for specified channel',
        access: app.Config.accessLevels.owner,
        call: popularityPurge,
    });

    // Return the script info
    return scriptInfo;
};
