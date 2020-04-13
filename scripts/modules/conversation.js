const scriptInfo = {
    name: 'conversation',
    desc: 'Allow the bot to be conversational in private messages, or randomly in channels',
    createdBy: 'IronY',
};
const _ = require('lodash');
const gen = require('../../lib/chatBotLine');
const random = require('../../lib/randomEngine.js');

// Make the bot randomly conversational
// Commands: converse
// Listeners: converse
module.exports = app => {
    // No Features block
    if (!_.has(app, 'Config.features.conversational')) return scriptInfo;

    /**
     * Converse Handler
     * @param to
     */
    const converseHandler = to => {
        app.Config.features.conversational.enabled = !_.isBoolean(app.Config.features.conversational.enabled) ? true : !app.Config.features.conversational.enabled;
        const formatText = app.Config.features.conversational.enabled ? 'now' : 'no longer';
        app.action(to, `is ${formatText} conversational`);
    };
    app.Commands.set('conversation', {
        desc: 'Make the bot randomly conversational',
        access: app.Config.accessLevels.admin,
        call: converseHandler,
    });

    /**
     * Converse Listener
     * @param to
     * @param from
     * @param text
     * @param message
     * @param is
     */
    const converseListener = (to, from, text, message, is) => {
        // Check if we are enabled
        const enabled = _.isBoolean(app.Config.features.conversational.enabled) && app.Config.features.conversational.enabled === true;
        // Get Random Chance, normalize to 500 if not a valid or unset integer
        const randomChance = _.isSafeInteger(app.Config.features.conversational.randomChance) ? app.Config.features.conversational.randomChance : 500;
        // Get and normalize ignored channels
        const ignoredChans = _.isArray(app.Config.features.conversational.ignoredChans) ? app.Config.features.conversational.ignoredChans : [];
        // See if we should send a message
        if (enabled && !_.includes(ignoredChans, to) && random.bool(1, is.privateMsg ? 1 : randomChance)) gen(text).then(result => app.say(to, `${from}, ${result}`));
    };
    app.Listeners.set('converse', {
        desc: `Provides a 1 in ${app.Config.features.conversational.randomChance} chance of random reply to message`,
        call: converseListener,
    });

    // Return the script info
    return scriptInfo;
};
