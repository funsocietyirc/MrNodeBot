'use strict';
const scriptInfo = {
    name: 'conversation',
    file: 'conversation.js',
    createdBy: 'Dave Richer'
};

const chatBot = (function() {
    var botObj = botObj || require('../../node_modules/bot/lib/bot.js'),
        botDb = botDb || require('../../node_modules/bot/lib/db.js'),
        botDefaults = botDefaults || require('../../node_modules/bot/db/defaults.json');
    return new botObj(new botDb, botDefaults);
}());

/**
  Make the bot randomly conversational
  Commands: converse
  Listeners: converse
**/
module.exports = app => {
    // See if we are conversational or not
    let conversational = app.Config.features.conversational.enabled;

    const converse = (to, from, text, message) => {
        conversational = !conversational;
        let formatText = conversational ? 'now' : 'no longer';
        app.say(to, `I am ${formatText} conversational`);
    };

    const listen = (to, from, text, message, is) => {
        if (!app.Config.features.conversational.ignoredChans.contains(to) && conversational && !is.triggered && app.random.bool(1, is.privateMsg ? 1 : app.Config.features.conversational.randomChance)(app.randomEngine)) {
            var replyText = chatBot.answer(text).replaceAll('<br>', '');
            app.say(to, `${from}, ${replyText}`);
        }
    };

    app.Commands.set('converse', {
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
