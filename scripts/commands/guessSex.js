'use strict';
const scriptInfo = {};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = app => {
    if (!app.Database || !Models.Logging) return scriptInfo;
    const getSexGuess = require('../generators/_GuessSexInfo');

    const getResults = nick => {
        return Models.Logging.query(qb =>
                qb
                .select(['text'])
                .where('from', 'like', nick)
                .orderBy('id', 'desc')
                .limit(250)
            )
            .fetchAll()
            .then(results => {
                let text = results.pluck('text').join(' ');
                return getSexGuess(text);
            })
    };

    const displaySexGuess = (to, from, text, message) => {
        let [nick] = text.split(' ');
        nick = nick || from;
        getResults(nick)
            .then(results => {
                _.each(results, (v, k) => {
                    app.say(to, `Language Genre: ${k} -> Female: ${v.female} -> Male : ${v.male} -> Difference: ${v.diff}; ${v.percentage}% -> Verdict: ${v.sex} ${v.weak ? '(Weak)' : ''}`);
                    if (v.weak) {
                        app.say(to, `You scored Weak, which could indiciate European origin.`);
                    }
                });
            })
            .catch(err => {
                console.log('Guess Sex Error');
                console.dir(err);
                app.say(to, `Something went wrong analying this data`);
            });
    };
    // Provide a OnConnected provider, this will fire when the bot connects to the network
    app.Commands.set('guess-sex', {
        call: displaySexGuess,
        desc: '[Nick?] Guess the sex of the user',
        access: app.Config.accessLevels.admin
    });

    return scriptInfo;
};
