const scriptInfo = {
    name: 'quotes',
    desc: 'Privates add-quote, del-quote, and quote. Allows rudimentary quote system',
    createdBy: 'IronY',
};

const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const Moment = require('moment');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const defaultVueOptions = require('../lib/_defaultVueOptions');
/**
 Keep Track of quotes
 Commands: quote-add quote-del quote
 * */
module.exports = (app) => {
    const addQuote = async (to, from, text, message) => {
        try {
            const normalizedText = text.trim();

            if (!normalizedText) {
                app.say(to, `I need quote to add, ${from}`);
                return;
            }

            const exists = await Models.Quotes.query(qb => qb.where('text', 'like', normalizedText).andWhere('to', 'like', to)).count();

            if (exists) {
                app.say(to, `That quote already exists for ${to}, ${from}`);
                return;
            }

            const quote = await Models.Quotes.create({
                to,
                from,
                text: normalizedText,
            });

            app.action(to, `hands ${from} a ticket with the number ${quote.id} on it`);
        }
        catch (err) {
            logger.error('something went wrong in addQuote', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong adding a quote, ${from}`);
        }
    };

    const delQuote = async (to, from, text, message) => {
        try {
            // Filter the input down to the first word
            const normalizedText = text.split(' ')[0];

            // Assure the input exists
            if (!normalizedText) {
                app.say(to, `I need quote to add, ${from}`);
                return;
            }

            // Assure the input is a number
            if (isNaN(parseInt(normalizedText)) || normalizedText < 1) {
                app.say(to, `I was expecting a positive number, ${from}`);
                return;
            }

            // Fetch the quote
            const quote = await Models.Quotes.query(qb => qb.where('id', normalizedText).andWhere('to', 'like', to)).fetch();

            // If the quote does not exist
            if (!quote) {
                app.say(to, `No quote with the ID ${normalizedText} exists, ${from}`);
                return;
            }

            if (
                app.isAdmin(from) ||
                app._ircClient.isOpInChannel(to, from) ||
                quote.attributes.from === from
            ) {
                try {
                    const quoteText = quote.attributes.text;
                    // Delete the quote
                    await quote.destroy({
                        require: false,
                    });

                    app.say(to, `I have destroyed quote ${normalizedText} (${quoteText}), ${from}`);
                    return;
                }
                catch (err) {
                    app.say(to, `I was unable to destroy the quote "${normalizedText}", ${from}`);
                    logger.error('Something went wrong destroying a quote', {
                        message: err.message || '',
                        stack: err.stack || '',
                    });
                    return;
                }
            }

            app.say(to, `You do not have the permissions to delete this quote, ${from}`);
        }
        catch (err) {
            logger.error('something went wrong in delQuote', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong deleting a quote, ${from}`);
        }
    };

    /**
     * Provide a random quote
     * @param to
     * @param from
     * @param text
     * @param message
     * @return {Promise<void>}
     */
    const randomQuote = async (to, from, text, message) => {
        try {
            // Get a quote
            const normalizedText = text.split(' ')[0];
            const idProvided = normalizedText && !isNaN(parseInt(normalizedText));

            const dbResults = idProvided ?
                await Models.Quotes.query(qb => qb.where('id', normalizedText)).fetch() :
                await Models.Quotes.query(qb => qb.where('to', 'like', to).orderByRaw('rand()').limit(1)).fetch();

            const output = new typo.StringBuilder({ logo: 'quotes' });

            if (!dbResults) {
                output.append(idProvided ? `A quote with the ID ${normalizedText} is not available, ${from}` : `There are no quotes available for ${to}, ${from}`);
                app.say(to, output.toString());
                return;
            }

            output
                .insertDivider()
                .append(dbResults.attributes.to)
                .append(dbResults.attributes.text)
                .append(dbResults.attributes.from)
                .append(Moment(dbResults.attributes.timestamp).fromNow());

            app.say(to,  output.toString());
        }
        catch (err) {
            logger.error('something went wrong in randomQuote', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, `Something went wrong fetching a quote, ${from}`);
        }
    };

    // Add a quote
    app.Commands.set('add-quote', {
        desc: 'Add A Quote',
        access: app.Config.accessLevels.identified,
        call: addQuote,
    });

    // Delete a quote
    app.Commands.set('del-quote', {
        desc: 'Delete a quote',
        access: app.Config.accessLevels.identified,
        call: delQuote,
    });

    // Get a random quote
    app.Commands.set('quote', {
        desc: 'Get a Random quote',
        access: app.Config.accessLevels.identified,
        call: randomQuote,
    });

    /**
     * Quotes Handler
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    const quotesHandler = async (req, res) => {
        // Return sorted result
        const results = await Models.Quotes.fetchAll();

        const data = {
            // Do not expose full path
            results: _.map(results.toJSON(), x => Object.assign({}, x, {
                timestamp: Moment(x.timestamp).fromNow(),
            })),
        };
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Quotes',
            }
        });
        res.renderVue('quotes.vue', data, req.vueOptions);
    };

    // Provide Web Route for script listing
    app.webRoutes.associateRoute('quotes', {
        desc: 'Quotes',
        path: '/quotes',
        handler: quotesHandler,
        navEnabled: true,
        navPath: '/quotes'
    });

    // API Endpoint to get quotes
    app.webRoutes.associateRoute('api.quotes.get', {
        desc: 'api.quotes.get',
        path: '/api/quotes/get/:to?',
        handler: async (req, res) => {
            // Add ability to filter on channel (to)
            const quotes = req.params.to ? Models.Quotes.where('to', req.params.to) : Models.Quotes;
            const results = await quotes.fetchAll();
            res.json({
                status: 'success',
                payload: results.toJSON(),
                count: results.length,
            });
        },
    });

    // Return the script info
    return scriptInfo;
};
