'use strict';

const HashMap = require('hashmap');
const Moment = require('moment');
const color = require('irc-colors');
const storage = require('node-persist');

/**
  Keep Track of quotes
  Commands: quote-add quote-del quote
**/
module.exports = app => {
    // Hold on to the collection
    let quotes = null;

    // Grab the collection
    storage.getItem('quotes', (err, value) => {
        if (value)
            quotes = new HashMap(value);
        else
            quotes = new HashMap();
    });

    const addQuote = (to, from, text, message) => {
        // No Quote provided
        if (!text || text.isEmpty()) {
            app.Bot.say(to, 'No quote specified');
            return;
        };

        // Nomralize text
        text = text.trim();

        if (!quotes.has(text)) {
            app.Bot.say(to, 'Quote has been added');
            // Define the quote
            quotes.set(text, {
                to: to,
                from: from,
                added: Moment()
            });
            storage.setItemSync('quotes', quotes);
        } else {
            app.Bot.say(to, 'Quote already exists');
        }
    };

    const delQuote = (to, from, text, message) => {
        // No Quote provided
        if (!text || text.isEmpty()) {
            app.Bot.say(to, 'Invalid quote sepcified');
            return;
        };

        // Normalize text
        text = text.trim();

        // Invalid Quote
        if (!quotes.has(text)) {
            app.Bot.say(to, 'This quote does not exist');
            return;
        }

        // Delete quote
        quotes.remove(text);
        storage.setItemSync('quotes', quotes);

        app.Bot.say(to, ' Quote has been removed');
    };

    const randomQuote = (to, from, text, message) => {
        // Get a random number, offset by -1
        var randomNumber = app.random.integer(1, quotes.count())(app.randomEngine) - 1;

        // Get the quote text to deal with the hashmap system
        var quote = quotes.keys()[randomNumber];

        // Bail out if we could not find key
        if (!quote) {
            app.Bot.say(to, 'There must not be any quotes yet');
            return;
        }

        // Get the metadata
        var data = quotes.values()[randomNumber];

        // Something went wrong extracting metadata
        if (!data || !data.added || !data.from) {
            Util.log(`Something went wrong with the quote system metadata for quote: ${quote}`);
            return;
        }

        // Output
        var dateString = Moment(data.added).format('MMMM YY, h:mm:ss a');
        var first = color.white.bold(`on ${dateString} by ${data.from}`);
        app.Bot.say(to, `"${quote}" : ${first}`);
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

};