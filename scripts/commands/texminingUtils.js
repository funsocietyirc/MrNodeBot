const scriptInfo = {
    name: 'textMiningUtils',
    desc: 'Text Mining Utilities',
    createdBy: 'IronY',
};
const _ = require('lodash');
const tm = require('textmining');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = (app) => {
    // Database not available
    if (!Models.Logging) {
        return scriptInfo;
    }

    /**
     * Top Terms Command
     * @param to
     * @param from
     * @param text
     * @param message
     * @return {Promise<void>}
     */
    const topTerms = async (to, from, text, message) => {
        const [nick, amount] = text.split(' ');
        const finalAmount = _.isSafeInteger(parseInt(amount)) ? amount : 10;
        if (!nick) {
            app.say(`I do not have enough information, ${from}`);
            return;
        }
        // Attempt
        try {
            // Fetch Results
            const results = await Models
                .Logging
                .query(qb =>
                    qb
                        .select(['text'])
                        .where('from', 'like', nick)
                )
                .fetchAll();

            // Validate Results
            if (!results.length) {
                app.say(to, `There are no results for ${nick}, ${from}`);
                return;
            }

            // Build a Bag Of Words (automatically normalize and remove stop words in the process)
            const bag = tm.bagOfWords(_.map(results.toJSON(), 'text'), true, true);

            // Sort terms by global frequency and print the top 10
            const termsByFrequency = bag.terms.sort(function (a, b) {
                if (a.frequency > b.frequency) return -1;
                else if (a.frequency < b.frequency) return 1;
                else return 0;
            });

            const top10Terms = _(termsByFrequency).map('term').filter(x => x !== '').uniq().take(finalAmount).value();
            app.say(to, `The Top ${finalAmount} Terms for ${nick} are: ${top10Terms.join(',')}`);
        } catch (err) {
            logger.error('Error in topTerms command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'An Error has occurred with your topTerms command');
        }
    };
    // Bind purge command
    app.Commands.set('topTerms', {
        desc: '[nick] (amount?) - Get the top terms of a user',
        access: app.Config.accessLevels.admin,
        call: topTerms,
    });


    // Return the script info
    return scriptInfo;
};
