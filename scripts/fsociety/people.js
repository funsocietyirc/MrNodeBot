'use static';
const scriptInfo = {
    name: 'FSociety Peoples',
    desc: 'Commands for certain #fsociety members',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const c = require('irc-colors');
const xray = require('x-ray')();
const Models = require('bookshelf-model-loader');
const excuse = require('../generators/_simpleExcuse');

module.exports = (app) => {

    // Check Jeeks Website to make sure he is still alive
    app.Commands.set('jeek', {
        desc: 'Is Jeek Alive?',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) =>
            // Get an array of H1 Elements from jeeks alive site
            xray('http://ishealive.jeek.net', ['h1'])((err, results) => {
                if (err || !results || !results[1]) {
                    app.say(to, 'Something went wrong finding out if jeek is alive')
                    return;
                }
                // If he is in the channel
                if (app.isInChannel(to, 'jeek')) {
                    app.action(to, 'points to jeek');
                }
                app.say(to, `Is Jeek Alive? ${results[1]}`);
            })
    });

    // Report an image of our lord and savour, RaptorJesus
    app.Commands.set('RaptorJesus', {
        desc: 'Get a pic of RaptorJesus',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            // If he is in the channel
            if (app.isInChannel(to, 'RaptorJesus')) {
                app.action(to, 'prays to RaptorJesus');
            }
            // Report back to IRC
            app.say(to, `Our Lord and Saviour: http://i.imgur.com/E1fQQdr.png`);
        }
    });

    // Report an image of our lord and savour, RaptorJesus
    app.Commands.set('eagle-excuse', {
        desc: 'Get a random excuse, DIY excuse style',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            // Report back to IRC
            excuse().then(excuses => app.say(to, _.first(excuses)));
        }
    });

    // Say Hello To Fr1end
    app.OnJoin.set('fsociety-fr1end', {
        call: (channel, nick, message) => {
          if(nick == 'fr1end') app.say(channel, `Hello fr1end...`);
        },
        name: 'Hello fr1end'
    });

    // Show a very attractive wheel barrowa
    app.Commands.set('redwheelbarrow', {
        desc: 'Show a Red Wheelbarrow',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => _.each([
          "                                   _______",
          "      ___________________________.'.------`",
          "     '---------------------------.'",
          "       `.       #FSOCIETY      .'",
          "     .-//`.                  .'",
          "  .' .//.'/`================'",
          " =[=:====:=]=           \\||",
          "  '. `--' .'             \_|",
          "    `-  -'",
        ], line => app.say(to, c.red(line)))
    });

    // Everything past this point requires the database
    if (!Models.Logging) return $scriptInfo;

    // Mother command
    const getMother = () => {
        let motherQuotes = [];
        let usedQuoteCount = 0;
        // Load Initial Mother responses from jeek
        return Models.Logging.query(qb =>
                qb
                .select(['text'])
                .where(clause =>
                    clause
                    .where('text', 'like', '%mother%')
                    .orWhere('text', 'like', '%mom%')
                    .andWhere('text', 'not like', '%moment%')
                    .andWhere('text', 'not like', 's/%')
                )
                .andWhere('from', 'like', 'jeek')
            )
            .fetchAll()
            .then(results => {
                // Prepare the mother quotes
                motherQuotes = _(results.pluck('text')).uniq().shuffle().value();
                // Bail if we have no quotes
                if (!motherQuotes.length) return;
                // Expose mother quotes command
                const mother = (to, from, text, message) => {
                    let commands = text.split(' ');
                    // Arguments
                    if (commands.length) {
                        switch (commands[0]) {
                            // Report back stack statistics
                            case 'total':
                                app.say(to, `On Stack: ${motherQuotes.length} Used: ${usedQuoteCount} Total: ${motherQuotes.length + usedQuoteCount}`);
                                return;
                        }
                    }
                    // Get a random quote then omit the quote from the collection
                    let say = () => {
                        // We have run out of quotes, reload!
                        if (!motherQuotes.length) {
                            return getMother().then(() => say());
                        }
                        // Take a quote form the stack
                        quote = motherQuotes.pop();
                        // Increase used quotes counter
                        usedQuoteCount = usedQuoteCount + 1;
                        // Report to IRC
                        app.say(to, quote);
                    };
                    say();
                };
                // Expose the mother command to IRC
                app.Commands.set('mother', {
                    desc: 'Get a your mother line care of Jeek',
                    access: app.Config.accessLevels.identified,
                    call: mother
                });
            })
            .catch(err => {
                console.log('Error Loading jeek mother quotes quotes');
                console.dir(err);
            });
    };
    // Load Initial set of quotes
    getMother();

    return scriptInfo;
};
