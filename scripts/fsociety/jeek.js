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

    let motherQuotes = [];
    let noResults = false;

    const getMother = () => {
        // Load Initial Mother responses from jeek
        return Models.Logging.query(qb =>
                qb
                .select(['text', 'id'])
                .where(clause =>
                    clause
                    .where('text', 'like', '%mother%')
                    .orWhere('text', 'like', '%mom%')
                )
                .andWhere('from', 'like', 'jeek')
                .andWhere('text', 'not like', 's/%')

            )
            .fetchAll()
            .then(results => {
                _(results.pluck('text')).uniq().each(t => motherQuotes.push(t));

                if (!motherQuotes.length) return;

                let mother = (to, from, text, message) => {
                    // Get a random quote then omit the quote from the collection
                    let say = () => {
                        quote = randomEngine.pick(motherQuotes);
                        motherQuotes = _.without(motherQuotes, quote);
                        app.say(to, quote);
                    };

                    // We have run out of quotes, reload!
                    if (!motherQuotes.length) {
                        return getMother().then(() => say());
                    }

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
        app.say(to, `Is Jeek Alive? ${results[1]}`);
    });

    // Total Messages command
    app.Commands.set('jeek', {
        desc: 'Is Jeek Alive?',
        access: app.Config.accessLevels.identified,
        call: jeek
    });

    return scriptInfo;
};
