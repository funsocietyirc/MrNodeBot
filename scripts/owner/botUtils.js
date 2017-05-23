'use strict';
const scriptInfo = {
    name: 'Bot Utilities',
    desc: 'Bot administrative commands',
    createdBy: 'IronY'
};
const _ = require('lodash');
const gen = require('../generators/_showerThoughts');
const typo = require('../lib/_ircTypography');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = app => {
    // Change the bots nick
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            let oldNick = app.nick;
            if (app.nick === text || _.isEmpty(text)) {
                app.say(to, `I am already ${app.nick}, what else would you like me to go by ${from}`);
                return;
            }
            app.nick = text;
            app.say(from, `I was once ${oldNick} but now I am ${app.nick}... The times, they are changing.`);

        }
    });

    // Set the 'Drunk' add-on
    app.Commands.set('drunk', {
        desc: 'It\'s party time',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            // The Key Already Exists
            app.Config.drunk = _.isBoolean(app.Config.drunk)
                ? !app.Config.drunk
                : true;

            app.say(to, app.Config.drunk
                ? `I am suddenly feeling very tipsy`
                : 'Well that was interesting...')
        }
    });

    // Get a list of channels the bot is on
    app.Commands.set('channels', {
        desc: 'Get a list of the current joined channels',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => app.say(from, `I am currently on the following channels: ${app.channels.join(', ')}`)
    });

    app.Commands.set('conf-get', {
        desc: '[key] - Get a configuration key',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            if (_.isEmpty(text)) {
                app.say(to, `You need to provide me with a key ${from}`);
                return;
            }
            let [key] = text.split(' ');
            if (!_.has(app.Config, key)) {
                app.say(to, `I do not have the config setting: ${key}, ${from}`);
                return;
            }
            app.say(to, `The config value you requested [${key}] is ` + JSON.stringify(_.get(app.Config, key, '')));
        }
    });

    app.Commands.set('spawn', {
        desc: '[valid js] will return value to console',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {

            // Parse arguments
            let [nick,
                amount] = text.split(' ');

            // Make sure we have a default amount
            amount = _.isSafeInteger(parseInt(amount))
                ? parseInt(amount)
                : 1;

            // Clone and modify initial config
            let config = _.cloneDeep(app.Config.irc);

            // Set Nick
            config.nick = (!_.isString(nick) || _.isEmpty(nick))
                ? app.nick
                : nick;

            // Hold on to initial nick
            config.originalNick = config.nick;

            // Reset variables
            config.password = '';
            config.sasl = false;
            config.channels = [];

            // Action to channel
            app.action(to, `focuses real hard`);

            // Check if nick is already in channel
            const originalNickIsActive = app._ircClient.isInChannel(to, nick);

            // Create IRC Instance
            const instance = new app._ircClient.Client(config.server, config.nick, config);

            // Connect
            instance.connect(() => {
                // Add to ignore list
                const wasIgnored = _.includes(app.Ignore, _.toLower(config.nick));
                if (!wasIgnored)
                    app.Ignore.push(instance.nick);

                // app.say(to, `I can feel ${config.nick} kicking ${from}!`);
                instance.join(to, () => gen(amount).then(results => Models.Logging.query(qb => qb.select('text').where('from', 'like', nick).orderByRaw('rand()').limit(amount)).fetchAll().then(logs => new Promise((res, rej) => {
                    // Hold All The Promises
                    let promises = [];
                    let key = 0;

                    // The person we are spawning is in the channel
                    if (originalNickIsActive)
                        promises.push(new Promise(r => setTimeout(() => r(instance.say(to, `Well hello ${config.originalNick}, seems there are two of us`)), ++key * 2500)));

                    // Join delay delay
                    promises.push(new Promise(r => setTimeout(r, ++key * 5000)));

                    // We have no results
                    if (!logs.length)
                        _.each(results, result => promises.push(new Promise(r => setTimeout(() => r(instance.say(to, result)), ++key * 2500)))); // We have results
                    else
                        _.each(logs.toJSON(), log => promises.push(new Promise(r => setTimeout(() => r(instance.say(to, log.text)), ++key * 2500))));

                    // Part delay
                    promises.push(new Promise(r => setTimeout(r, ++key * 5000)));

                    // Iterate over promises
                    return Promise.all(promises).then(res);
                })).then(() =>
                    // Leave the channel
                    instance.part(to, 'I was only but a dream', () => {
                            // Disconnect
                            instance.disconnect();
                            // Remove temp name from ignore list
                            if (!wasIgnored)
                                _.remove(app.Ignore, instance.nick);
                        }
                    ))
                // We have an error
                    .catch(err => {
                        logger.error('Something went wrong in the botUtils spawn command', {err});
                        app.say('Something did not go quite right...');
                    })));

            });
        }
    });

    // set
    app.Commands.set('conf-set', {
        desc: '[key value] - Manipulate config values',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            // Make sure we have text
            if (!_.isString(text) || _.isEmpty(text)) {
                app.say(to, `I need a value to set ${from}`);
                return;
            }

            // Get Key Value pair
            let matches = text.match(/(\S+)\s(.*)/im);

            if (!matches || !matches[1] || !matches[2]) {
                app.say(to, `I need a key and a value ${from}`);
                return;
            }

            // Config Key
            let key = matches[1];
            // Config Value in JSON
            let value = matches[2].replace(/'/g, '"');
            // Does the key already exist in the config store
            let exists = _.has(app.Config, key);
            let defaultValue = _.get(app.Config, key);

            // Attempt to parse JSON
            let json;

            try {
                json = JSON.parse(value);
            } catch (err) {
                app.say(to, 'I was unable to parse this value, please use json notation, wrap strings with ""');
                return;
            }

            // If we have anything other then an object but the original is an object
            if (exists && _.isObject(defaultValue) && !_.isObject(json)) {
                app.say(to, 'I can only replace a Object with another Object');
                return;
            }

            // If we have anything other then an array but the original is an array
            if (exists && _.isArray(defaultValue) && !_.isArray(json)) {
                app.say(to, 'I can only replace a Array with another Array');
                return;
            }

            if (exists && _.isString(defaultValue) && !_.isString(json)) {
                app.say(to, 'I can only replace a String with another String');
                return;
            }

            // Set the value
            _.set(app.Config, key, json);

            // Create output
            const output = new typo.StringBuilder();
            output.appendBold('Set').append(exists
                ? 'updating'
                : 'inserting').insert(`config.${key} to`).append(value);
            app.say(to, output.text);
        }
    });

    // Return the script info
    return scriptInfo;
};
