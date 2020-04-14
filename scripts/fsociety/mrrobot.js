const scriptInfo = {
    name: 'mrrobot',
    desc: 'Watch for quotes from the MrRobot bot, log them, clean them, and allow for announcement of them',
    createdBy: 'IronY',
};
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    // Do not load module if we have no database
    if (!Models.MrRobotQuotes) { return scriptInfo; }

    const quoteModel = Models.MrRobotQuotes;

    const includeExceptions = [
        'i am Mr. Robot (~mrrobot@unaffiliated/kl4200/bot/mrrobot)',
        'Error:',
        'Get a random fact from the database of weird facts',
        'I\'m now ignoring you for 5 minutes.',
        'I don\'t recognize you. You can message me either of these two commands:',
        'invalid commands within the last',
        'Quote #',
    ];

    /**
     * Clean Quotes Handler
     * @returns {Promise<void>}
     */
    const cleanQuotesHandler = async () => {
        try {
            // Get Results from database
            const results = await quoteModel.query((qb) => {
                qb.where('quote', 'like', '%(1 more message)%').select(['id', 'quote']);
            }).fetchAll();

            // Verify there are results
            if (!results.length) {
                logger.info('Running MrRobot Quote clean up job, nothing to clean up...');
                return;
            }

            // Attempt to clean and merge
            for (const result of results) {
                const secondLine = await quoteModel.where('id', result.attributes.id + 1).fetch();
                await result.set('quote', `${result.get('quote').replace('(1 more message)', '')} ${secondLine.get('quote')}`).save();
                logger.info(`Cleaned up MrRobot show quotes, merged quote ${result.get('id')} and ${secondLine.get('id')}`);
                secondLine.destroy({
                    require: false
                });
            }
        } catch (err) {
            // Handle exception
            logger.error('Something went wrong in the cleanQuotes function inside mrrobot.js', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    // Clean and merge quotes
    app.Commands.set('mrrobot-clean', {
        desc: 'Clean multi-line quotes',
        access: app.Config.accessLevels.owner,
        call: cleanQuotesHandler,
    });

    /**
     * Quotes Listener
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const quotesListener = async (to, from, text) => {
        // False result
        if (!text || to !== '#MrRobot' || from !== 'MrRobot' || _.includes(includeExceptions, text) || text.split(' ').length < 3) { return; }

        // Check if the quote already exists
        try {
            await quoteModel.query(qb => qb.select(['quote']).where('quote', 'like', text).limit(1)).fetch();
        } catch (err) {
            // Problem communicating with the Database
            logger.error('Error getting result from DB in MrRobotQuote', {
                message: err.message || '',
                stack: err.stack || '',
            });
            return;
        }

        // Record already exists
        if (result) { return; }

        // Attempt to save the new quote
        try {
            await quoteModel.insert({quote: text});
            // Log the quote was added
            logger.info(`Added New MrRobot show quote: ${text}`);
        } catch (err) {
            // Something went wrong saving the new quote
            logger.error('Error saving result from DB in MrRobotQuote', { err });
        }
    };
    app.Listeners.set('mrrobotquotes', {
        desc: 'Log quotes from #MrRobot',
        call: quotesListener,
    });

    /**
     * Quotes Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const quotesHandler = async (to, from, text) => {
        try {
            // Fetch Result
            const result = await quoteModel.query((qb) => {
                qb.select('quote').orderByRaw('rand()').limit(1);
                if (_.isString(text) && !_.isEmpty(text.trim())) {
                    qb.andWhere('quote', 'like', `%${text}%`);
                }
            }).fetch();

            // Report back
            app.say(to, !result
                ? 'I have not yet encountered anything like that.'
                : `${ircTypography.logos.mrrobot} ${result.get('quote')}`);
        } catch (err) {
            logger.error('Something went wrong with the mrrobot command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong fetching your quote ${from}`);
        }
    };
    app.Commands.set('mrrobot', {
        desc: '[Search Text?] Mr Robot quotes powered by #MrRobot',
        access: app.Config.accessLevels.identified,
        call: quotesHandler,
    });

    // Schedule job
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 0;
    scheduler.schedule('cleanMrRobotQuotes', cronTime, cleanQuotesHandler);

    return scriptInfo;
};
