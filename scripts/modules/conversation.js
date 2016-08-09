'use strict';

const chatBot = (function() {
    var botObj = botObj || require('../../node_modules/bot/lib/bot.js'),
        botDb = botDb || require('../../node_modules/bot/lib/db.js'),
        botDefaults = botDefaults || require('../../node_modules/bot/db/defaults.json'),
        bot = new botObj(new botDb, botDefaults);
    return bot;
}());

/**
  Make the bot randomlly conversational
  Commands: converse
  Listeners: converse
**/
module.exports = app => {
    // See if we are conversational or not
    let conversational = app.Config.features.conversational.enabled;

    const converse = (to, from, text, message) => {
        conversational = !conversational;
        let formatText = conversational ? 'now' : 'no longer';
        app.Bot.say(to, `I am ${formatText} conversational`);
    };

    const listen = (to, from, text, message, is) => {
        if (conversational && !is.triggered && app.random.bool(1, is.privMsg ? 1 : 500)(app.randomEngine)) {
            var replyText = chatBot.answer(text).replaceAll('<br>', '');
            app.Bot.say(to, `${from}, ${replyText}`);
        }
    };

    app.Commands.set('converse', {
        desc: 'Make the bot randomly conversational',
        access: app.Config.accessLevels.admin,
        call: converse
    });

    app.Listeners.set('converse', {
        desc: 'Provides a one in five hundred chance of random reply to message',
        call: listen
    });

};
