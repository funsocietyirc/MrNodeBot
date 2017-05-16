'use strict';
const scriptInfo = {
    name: 'quotes',
    desc: 'Privates add-quote, del-qutote, and quote. Allows rudenemntary quote system',
    createdBy: 'IronY'
};
const Moment = require('moment');
const color = require('irc-colors');
const storage = require('node-persist');
const random = require('../../lib/randomEngine');
const logger = require('../../lib/logger');
const _ = require('lodash');

/**
 Keep Track of quotes
 Commands: quote-add quote-del quote
 **/
module.exports = app => {
    // Hold on to the collection
    let quotes = null;

    // Grab the collection
    storage.getItem('quotes', (err, value) => {
        if (value) quotes = new Map(value);
        else quotes = new Map();
    });

    const addQuote = (to, from, text, message) => {
        // No Quote provided
        if (_.isEmpty(text)) {
            app.say(to, 'No quote specified');
            return;
        }

        // Normalize text
        text = text.trim();

        if (!quotes.has(text)) {
            app.say(to, 'Quote has been added');
            // Define the quote
            quotes.set(text, {
                to: to,
                from: from,
                added: Moment()
            });
            storage.setItemSync('quotes', quotes);
        } else {
            app.say(to, 'Quote already exists');
        }
    };

    const delQuote = (to, from, text, message) => {
        // No Quote provided
        if (_.isEmpty(text)) {
            app.say(to, 'Invalid quote sepcified');
            return;
        }

        // Normalize text
        text = text.trim();

        // Invalid Quote
        if (!quotes.has(text)) {
            app.say(to, 'This quote does not exist');
            return;
        }

        // Delete quote
        quotes.delete(text);
        storage.setItemSync('quotes', quotes);

        app.say(to, ' Quote has been removed');
    };

    const randomQuote = (to, from, text, message) => {

        // Bail out if we could not find key
        if (!quotes.size) {
            app.say(to, 'There must not be any quotes yet');
            return;
        }

        // Get a random number, offset by -1
        const randomNumber = random.integer(1, quotes.size);

        // Get the quote text to deal with the hash map system
        const quote = quotes.keys()[randomNumber - 1];

        // Get the metadata
        let data = quotes.values()[randomNumber];

        // Something went wrong extracting metadata
        if (!data || !data.added || !data.from) {
            logger.error(`Something went wrong with the quote system metadata for quote: ${quote}`);
            return;
        }

        // Output
        const dateString = Moment(data.added).format('MMMM YY, h:mm:ss a');
        const first = color.white.bold(`on ${dateString} by ${data.from}`);
        app.say(to, `"${quote}" : ${first}`);
    };

    // Add a quote
    app.Commands.set('add-quote', {
        desc: 'Add A Quote',
        access: app.Config.accessLevels.admin,
        call: addQuote
    });

    // Delete a quote
    app.Commands.set('del-quote', {
        desc: 'Delete a quote',
        access: app.Config.accessLevels.admin,
        call: delQuote
    });

    // Get a random quote
    app.Commands.set('quote', {
        desc: 'Get a Random quote',
        access: app.Config.accessLevels.identified,
        call: randomQuote
    });

    // Return the script info
    return scriptInfo;
};
