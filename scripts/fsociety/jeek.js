'use static';
const scriptInfo = {
    name: 'jeek',
    file: 'jeek.js',
    desc: 'Is Jeek alive?',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const xray = require('x-ray')();
const Models = require('bookshelf-model-loader');
const scheduler = require('../../lib/scheduler');
const randomEngine = require('../../lib/randomEngine');


module.exports = (app) => {
    if (!Models.Logging) return $scriptInfo;

    const motherQuotes = [];
    let usedQuoteCount = 0;

    const getMother = () => {
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
                _(results.pluck('text')).uniq().filter(t => !_.includes(t, 'moment')).each(t => motherQuotes.push(t));

                if (!motherQuotes.length) return;

                let mother = (to, from, text, message) => {
                    let commands = text.split(' ');

                    // Arguments
                    if(commands.length) {
                      switch(commands[0]) {
                        case 'total':
                          app.say(to, `On Stack: ${motherQuotes.length} Used: ${usedQuoteCount} Total: ${motherQuotes.length + usedQuoteCount}`);
                          return;
                      }
                    }

                    // Get a random quote then omit the quote from the collection
                    let say = () => {
                        quote = randomEngine.pick(motherQuotes);
                        _.pull(motherQuotes, quote);
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
        if(app.isInChannel(to, 'jeek')) {
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
      if(app.isInChannel(to, 'RaptorJesus')) {
        app.action(to, 'prays to RaptorJesus');
      }

      app.say(to, `Our Lord and Saviour: http://i.imgur.com/E1fQQdr.png`);
    }

    // Total Messages command
    app.Commands.set('RaptorJesus', {
        desc: 'Get a pic of RaptorJesus',
        access: app.Config.accessLevels.identified,
        call: raptorJesus
    });

    return scriptInfo;
};
