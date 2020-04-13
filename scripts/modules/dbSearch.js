const scriptInfo = {
    name: 'dbSearch',
    desc: 'Provides some interaction with the message logging model, such has total messages, random line' +
    'and last mentioned',
    createdBy: 'IronY',
};

const _ = require('lodash');
const Moment = require('moment');
const Models = require('funsociety-bookshelf-model-loader');
const accounting = require('accounting-js');

const logger = require('../../lib/logger');

// Database Specific Commands
// Commands: last-mentioned, random-line
module.exports = app => {
    // Only enabled if there is a database available
    if (!Models.Logging) return scriptInfo;

    /**
     * Total Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const totalHandler = async (to, from, text) => {
        const channel = text.split(' ')[0] || to;
        try {
            const result = await Models.Logging
                .where('to', '=', channel)
                .count();

            if (result === 0) {
                app.say(to, `I have no results for ${channel}, ${from}`);
                return;
            }

            app.say(to, `Total Messages from ${channel}: ${accounting.formatNumber(result, {
                precision: 0,
            })}`);
        } catch (err) {
            logger.error('Something went wrong in the total Command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `I am sorry ${from}, something went wrong fetching the total information`);
        }
    };
    app.Commands.set('total', {
        desc: '[channel?] Get total amount of recorded messages for a channel',
        access: app.Config.accessLevels.identified,
        call: totalHandler,
    });

    /**
     * Random Line Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const randomLineHandler = async (to, from, text) => {
        try {
            const result = await Models
                .Logging
                .query((qb) => {
                    qb.select('from', 'text').where('to', to).orderByRaw('rand()').limit(1);
                    if (text) qb.andWhere('text', 'like', text);
                })
                .fetch();

            app.say(to, !result ?
                'Nothing like that has ever been said in here... yet!' :
                `${result.get('from')} : ${result.get('text')}`);
        } catch (err) {
            logger.error(`Something went wrong in the randomLine Command`, {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `I am sorry ${from}, something went wrong fetching the random line information`);
        }
    };
    app.Commands.set('random-line', {
        desc: '[Search Text?] Get a random line from the channel, accepts argument as search string',
        access: app.Config.accessLevels.identified,
        call: randomLineHandler,
    });

    /**
     * Search Terms Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const searchTermsHandler = async (to, from, text,) => {
        let [terms, channel, nicks] = text.split(' ');

        channel = channel || to;
        terms = _.without(terms.split('|'), '');
        nicks = !_.isUndefined(nicks) ? _.without(nicks.split('|'), '') : [];
        if (!terms.length) {
            app.say(to, 'You have not presented any search terms');
            return;
        }

        try {
            const results = await Models.Logging
                .query(qb => qb
                    .where('to', 'like', channel).andWhere(clause => terms.forEach(term => clause.andWhere('text', 'like', `%${term}%`)))
                    .andWhere(clause => nicks.forEach(nick => clause.andWhere('from', 'like', nick)))
                    .orderBy('timestamp', 'desc'))
                .fetchAll();

            if (!results.length) {
                app.say(to, `No results found for terms ${terms.join(', ')} in ${channel}`);
                return;
            }

            app.say(to, `Sending ${results.length} result(s) for your search on ${terms.join(', ')} in ${channel}`);
            app.say(from, `Providing ${results.length} result(s) for term(s) ${terms.join(', ')} in ${channel}`);

            let delay = 0;

            results.forEach((result) => {
                delay += 1;
                setTimeout(
                    () => app.say(from, `${result.attributes.from} ${Moment(result.attributes.timestamp).fromNow()} - ${result.attributes.text}`),
                    delay * 2000,
                    result,
                    from,
                );
            });
        } catch (err) {
            logger.error('Error in searchTerms', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `I am sorry ${from}, something went wrong fetching the search results`);
        }
    };
    app.Commands.set('search-terms', {
        desc: '[terms] [channel?] - Search Buffer by terms',
        access: app.Config.accessLevels.admin,
        call: searchTermsHandler,
    });

    /**
     * Last Said Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const lastSaidHandler = async (to, from, text) => {
        // No text was provided
        if (!text) {
            app.say(to, 'You did not enter in a word, silly');
            return;
        }
        try {
            const result = await Models.Logging
                .query(qb => qb
                    .where('to', 'like', to)
                    .andWhere('text', 'like', text)
                    .orderBy('id', 'desc')
                    .limit(1))
                .fetch();

            if (!result) {
                app.say(to, 'Nothing was ever said like that in this channel');
                return;
            }

            const resFrom = result.get('from');
            const resTo = result.get('to');

            if (resTo === resFrom) {
                // The request is from the originator of the private message
                if (resfrom !== from) app.say(to, 'The last utterance of that was told to me in private and I am not willing to share');
                // Request is from someone other than who sent the message
                else app.say(from, `You said "${result.get('text')}" ${Moment(result.get('timestamp')).fromNow()} in a private message`);
            } else app.say(to, `${resFrom} said "${result.get('text')}" on ${Moment(result.get('timestamp')).fromNow()} in this channel`);
        } catch (err) {
            logger.error('Something went wrong in the lastSaid Command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `I am sorry ${from}, something went wrong fetching the last said information`);
        }
    };
    app.Commands.set('last-said', {
        desc: '[phrase] Get the last time a phrase was said',
        access: app.Config.accessLevels.identified,
        call: lastSaidHandler,
    });

    // Return the script info
    return scriptInfo;
};
