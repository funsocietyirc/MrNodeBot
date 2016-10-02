'use strict';
const scriptInfo = {
    name: 'mrrobot',
    file: 'mrorbot.js',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const model = require('bookshelf-model-loader').MrRobotQuotes;

module.exports = app => {
    const includeExceptions = [
        'i am Mr. Robot (~mrrobot@unaffiliated/kl4200/bot/mrrobot)',
        'Error:',
        'Get a random fact from the database of weird facts',
        'I don\'t recognize you. You can message me either of these two commands:',
        'invalid commands within the last',
        'Quote #'
    ];

    // Handler
    const loggingCmd = (to, from, text, message) => {
        if (!text || to != '#MrRobot' || from != 'MrRobot' || _.includes(includeExceptions, text) || text.split(' ').length < 3) {
            return;
        }
        model.query(qb => {
            qb.where('quote', 'like', text)
                .count().then(count => {
                    if (!count) {
                        return;
                    }
                    qb.insert({
                        quote: text
                    })
                    .then(result => {
                      console.log(text);
                    })
                    .catch(err => console.log(err));
                });
        });
    };

    const mrrobot = (to, from, text, message) => {
        model.query(qb => {
                qb.select('quote').orderByRaw('rand()').limit(1);
                if (text) {
                    qb.andWhere('quote', 'like', text);
                }
            })
            .fetch()
            .then(result => {
                if (!result) {
                    app.say(to, `There is no quote data yet. Ask your dude to run the Seed.`);
                    return;
                }
                app.say(to, `${result.get('quote')} -- Powered By #MrRobot`);
            });
    };

    app.Commands.set('mrrobot', {
        desc: '[Search Text] Mr Robot quotes powered by #MrRobot',
        access: app.Config.accessLevels.identified,
        call: mrrobot
    });

    // Listen and Log
    app.Listeners.set('mrrobotquotes', {
        desc: 'Log quotes from #MrRobot',
        call: loggingCmd
    });

    return scriptInfo;
};
