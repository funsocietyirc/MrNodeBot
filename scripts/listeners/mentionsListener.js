const scriptInfo = {
    name: 'Mention Listener',
    desc: 'Keep track of mentions',
    createdBy: 'IronY',
};
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

// Special Thanks to [mbm] for this wonderful regex
// noinspection RegExpRedundantEscape
const pattern = /\B@((?!\w*\.\w)[\w\[\]|\-`\\{}\^]{1,16}(?!\w))/gi;

module.exports = app => {
    // Assure the database and logging table exists
    if (!Models.Mention || !Models.Mentioned) return scriptInfo;
    // Parse for mentions
    const mentions = async (to, from, text, message) => {
        // Private message or empty string, bail
        if (to === from || !_.trim(text)) return;

        // Setup variables
        let match;
        let results = [];

        // Check for matches
        // noinspection JSAssignmentUsedAsCondition
        while (match = pattern.exec(text)) results.push(match[1]);

        // No initial results, bail
        if (_.isEmpty(results)) return;

        // Filter out duplicates, and verify the users are in the channel
        results = _(results)
            .uniqBy(r => r.toLowerCase())
            .filter(r => app._ircClient.isInChannel(to, r) && r.toLowerCase() !== from.toLowerCase())
            .value();

        // No results after filtering, bail
        if (_.isEmpty(results)) return;

        try {
            const mention = await Models.Mention.create({
                text,
                by: from,
                channel: to,
                user: message.user,
                host: message.host,
            });

            const mentionStack = [];

            _.forEach(results, nick => mentionStack.push(Models.Mentioned.create({
                nick,
                mention_id: mention.id,
            })));

            return Promise.all(mentionStack);
        } catch (err) {
            logger.error('Error recording mention', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    app.Listeners.set('mentions', {
        desc: 'Mentions',
        call: mentions,
    });

    /**
     *  Mention Listener
     * @param from
     * @param to
     * @param text
     * @param message
     * @returns {Promise<undefined|*>}
     */
    const mentionListener = (from, to, text, message) => mentions(to, from, text, message);
    app.OnAction.set('mentions', {
        call: mentionListener,
        name: 'mentions',
    });

    // All went OK
    return scriptInfo;
};
