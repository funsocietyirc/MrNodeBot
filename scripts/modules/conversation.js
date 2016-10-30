'use strict';
const scriptInfo = {
    name: 'conversation',
    desck: 'Allow the bot to be conversational in private messages, or randomly in channels',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const gen = require('../generators/_chatBotLine');
const random = require('../../lib/randomEngine.js');
/**
  Make the bot randomly conversational
  Commands: converse
  Listeners: converse
**/
module.exports = app => {
    // See if we are conversational or not
    let conversational = app.Config.features.conversational.enabled;
    let ignoredChans = app.Config.features.conversational.ignoredChans;
    let randomChance = app.Config.features.conversational.randomChance;

    const converse = (to, from, text, message) => {
        conversational = !conversational;
        let formatText = conversational ? 'now' : 'no longer';
        app.say(to, `I am ${formatText} conversational`);
    };

    const listen = (to, from, text, message, is) => {
        if (conversational && !_.includes(ignoredChans, to) && !is.triggered && random.bool(1, is.privateMsg ? 1 : randomChance)) {
            gen(text)
              .then(result => app.say(to, `${from}, ${result}`));
        }
    };

    // Toggle the conversational listener status
    app.Commands.set('conversation', {
        desc: 'Make the bot randomly conversational',
        access: app.Config.accessLevels.admin,
        call: converse
    });

    app.Listeners.set('converse', {
        desc: `Provides a 1 in ${app.Config.features.conversational.randomChance} chance of random reply to message`,
        call: listen
    });

    // Return the script info
    return scriptInfo;
};
