'use static';
const scriptInfo = {
    name: 'FSociety Peoples',
    file: 'people.js',
    desc: 'Commands for certain #fsociety members',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const xray = require('x-ray')();
const Models = require('bookshelf-model-loader');

module.exports = (app) => {
    if (!Models.Logging) return $scriptInfo;


    const getMother = () => {
        let motherQuotes = [];
        let usedQuoteCount = 0;
        // Load Initial Mother responses from jeek
        motherQuotes.splice(0, motherQuotes.length);

        return Models.Logging.query(qb =>
                qb
                .select(['text', 'id'])
                .where(clause =>
                    clause
                    .where('text', 'like', '%mother%')
                    .orWhere('text', 'like', '%mom%')
                    .andWhere('text', 'not like', 's/%')
                )
                .andWhere('from', 'like', 'jeek')
            )
            .fetchAll()
            .then(results => {
                // Prepare the mother quotes
                _(results.pluck('text')).uniq().filter(t => !_.includes(t, 'moment')).each(t => motherQuotes.push(t));
                // Bail if we have no quotes
                if (!motherQuotes.length) return;
                // Shuffle quotes
                motherQuotes = _.shuffle(motherQuotes);
                // Expose mother quotes command
                const mother = (to, from, text, message) => {
                    let commands = text.split(' ');

                    // Arguments
                    if (commands.length) {
                        switch (commands[0]) {
                            case 'total':
                                app.say(to, `On Stack: ${motherQuotes.length} Used: ${usedQuoteCount} Total: ${motherQuotes.length + usedQuoteCount}`);
                                return;
                        }
                    }

                    // Get a random quote then omit the quote from the collection
                    let say = () => {
                        quote = motherQuotes.pop();
                        usedQuoteCount = usedQuoteCount + 1;
                        app.say(to, quote);
                        // We have run out of quotes, reload!
                        if (!motherQuotes.length) {
                            return getMother().then(() => say());
                        }
                    };
                    say();
                };
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


    // Check Jeeks Website to make sure he is still alive
    const jeek = (to, from, text, message) => xray('http://ishealive.jeek.net', ['h1'])((err, results) => {
        if (err || !results || !results[1]) {
            app.say(to, 'Something went wrong finding out if jeek is alive')
            return;
        }
        // If he is in the channel
        if (app.isInChannel(to, 'jeek')) {
            app.action(to, 'points to jeek');
        }
        app.say(to, `Is Jeek Alive? ${results[1]}`);
    });

    app.Commands.set('jeek', {
        desc: 'Is Jeek Alive?',
        access: app.Config.accessLevels.identified,
        call: jeek
    });

    // Report an image of our lord and savour, RaptorJesus
    const raptorJesus = (to, from, text, message) => {
        // If he is in the channel
        if (app.isInChannel(to, 'RaptorJesus')) {
            app.action(to, 'prays to RaptorJesus');
        }

        app.say(to, `Our Lord and Saviour: http://i.imgur.com/E1fQQdr.png`);
    };

    // Total Messages command
    app.Commands.set('RaptorJesus', {
        desc: 'Get a pic of RaptorJesus',
        access: app.Config.accessLevels.identified,
        call: raptorJesus
    });

    return scriptInfo;
};
