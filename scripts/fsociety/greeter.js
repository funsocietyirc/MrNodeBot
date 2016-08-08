/**
    Greet the users in #fsociety
    TODO: Make multi-channel and configurable
**/
'use strict';

const _ = require('lodash');

// More readable inline leet speak
const l33t = (text) => text
    .replace('a','4')
    .replace('b','6')
    .replace('e','3')
    .replace('s','$')
    .replace('i','1')
    .replace('t','7')
    .replace('o','0');

// In memory cache
const greetCache = [];
module.exports = app => {
    const salutations = _.map([
        'Greetings', 'Hail', 'Welcome', 'Salutations', 'Alhoa',
        'Howdy', 'Hi', 'Hey', 'Hiya', 'Good Day', 'Yo', 'How are you', 'Salute', 'What\'s up', 'Bonsoir'
    ],l33t);

    const appends = _.map([
        'hello friend','it\'s happening', 'what are your instructions', 'I saved a chair for you'
    ],l33t);

    const onJoin = (channel, nick, message) => {
        // Make sure we are not reporting ourselves
        if (nick != app.Bot.nick && channel == '#fsociety' && greetCache.indexOf(nick) == -1) {
            setTimeout(() => {
                let greeting = app.random.pick(app.randomEngine, salutations);
                let append =app.random.pick(app.randomEngine, appends);
                app.Bot.say(nick, `${greeting} ${nick}, ${append}.`);
            }, 3000);
            setTimeout(() => {
                greetCache.push(nick);
            },3100);
        }
    };

    const clearGreetingCache = (channel, nick,message) => {
            greetCache.splice(0, greetCache.length);
            app.Bot.say(nick, 'Greeting Cache cleared');
    };

    // Provide a onjoin handler
    app.OnJoin.set('fsociety-greeter', {
        call: onJoin,
        name: 'fsociety-greetr'
    });
    
    // Clear Cache
    app.Commands.set('clear-greet-cache', {
        desc: 'Clear the Greeting cache',
        access: app.Config.accessLevels.admin,
        call: clearGreetingCache
    });

};
