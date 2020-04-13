const scriptInfo = {
    name: 'Guess Sex',
    desc: 'Guess the sex of a user based on their chat history',
    createdBy: 'IronY',
};

// Original concept credited to http://www.hackerfactor.com/GenderGuesser.php
const _ = require('lodash');

const type = require('../lib/_ircTypography');
const logger = require('../../lib/logger');
const getSexGuess = require('../generators/_guessSexInfo');
const Models = require('funsociety-bookshelf-model-loader');

const sampleSize = 1000;

module.exports = app => {
    if (!Models.Logging) return scriptInfo;

    /**
     * Get Results
     * @param nick
     * @returns {Promise<*>}
     */
    const getResults = async nick => {
        const results = await Models.Logging
            .query(qb =>
                qb
                    .select(['text'])
                    .where('from', 'like', nick)
                    .orderBy('id', 'desc')
                    .limit(sampleSize))
            .fetchAll();

        return getSexGuess(results.pluck('text').join(' '));
    };

    /**
     * Display Sex guess
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const displaySexGuess = async (to, from, text) => {
        let [nick] = text.split(' ');
        nick = nick || from;

        // Because why not
        if (app._ircClient.isBotNick(nick)) {
            app.say(to, `I am clearly {a male|a female|an Apache attack helicopter|whatever you want me to be|gender fluid|gender nonconforming}, ${from}`);
            return;
        }

        try {
            const r = await getResults(nick);
            const t = r.results.Combined;
            const buffer = `Gender Guesser ${type.icons.sideArrow} ${nick} ${type.icons.sideArrow} ${r.sampleSize} words sampled ${type.icons.sideArrow} ` +
                `${type.title('Female:')} ${t.female} ${type.icons.sideArrow} ${type.title('Male')} : ${t.male} ` +
                `${type.icons.sideArrow} ${type.title('Diff:')} ${t.diff} ${type.icons.sideArrow} ${type.colorNumber(t.percentage)}% ${type.icons.sideArrow} ` +
                `${t.sex} ${t.weak ? ` ${type.icons.sideArrow} (EU?)` : ''}`;

            app.say(to, buffer);
        } catch (err) {
            logger.error('Guess Sex Error', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, err);
        }
    };
    app.Commands.set('gender', {
        call: displaySexGuess,
        desc: '[Nick?] Guess the sex of the user',
        access: app.Config.accessLevels.admin,
    });

    return scriptInfo;
};
