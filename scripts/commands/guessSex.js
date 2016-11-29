'use strict';
const scriptInfo = {
    name: 'Guess Sex',
    desc: 'Guess the sex of a user based on their chat history',
    createdBy: 'IronY'
};

// Original concept credited to http://www.hackerfactor.com/GenderGuesser.php

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const sampleSize = 1000;
const logger = require('../../lib/logger');

module.exports = app => {
    if (!app.Database || !Models.Logging) return scriptInfo;
    const getSexGuess = require('../generators/_guessSexInfo');
    const type = require('../lib/_ircTypography');

    const getResults = nick => {
        return Models.Logging.query(qb =>
                qb
                .select(['text'])
                .where('from', 'like', nick)
                .orderBy('id', 'desc')
                .limit(sampleSize)
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
            .then(r => {
                let t = r.results.Combined;
                let buffer = `Gender Guesser ${type.icons.sideArrow} ${nick} ${type.icons.sideArrow} ${r.sampleSize} words sampled ${type.icons.sideArrow} ` +
                `${type.title('Female:')} ${t.female} ${type.icons.sideArrow} ${type.title('Male')} : ${t.male} ` +
                `${type.icons.sideArrow} ${type.title('Diff:')} ${t.diff} ${type.icons.sideArrow} ${type.colorNumber(t.percentage)}% ${type.icons.sideArrow} ` +
                `${t.sex} ${t.weak ? ` ${type.icons.sideArrow} (EU?)` : ''}`;
                app.say(to, buffer);
            })
            .catch(err => {
                logger.error('Guess Sex Error', {err})
                app.say(to, err);
            });
    };
    // Provide a OnConnected provider, this will fire when the bot connects to the network
    app.Commands.set('gender', {
        call: displaySexGuess,
        desc: '[Nick?] Guess the sex of the user',
        access: app.Config.accessLevels.admin
    });

    return scriptInfo;
};
