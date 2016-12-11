'use strict';
const scriptInfo = {
    name: 'Bot Utilities',
    desc: 'Bot administrative commands',
    createdBy: 'IronY'
};

const _ = require('lodash');
const typo = require('../lib/_ircTypography');

module.exports = app => {
    // Change the bots nick
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            let oldNick = app.nick;
            app.nick = text;
            app.say(from, `I was once ${oldNick} but now I am ${app.nick}... The times, they are changing.`);

        }
    });
    // Get a list of channels the bot is on
    app.Commands.set('channels', {
        desc: 'Get a list of the current joined channels',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.say(from, `I am currently on the following channels: ${app.channels.join(', ')}`);
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
            let matches = text.match(/(\S+)\s(.*)/im)

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

            // Attempt to parse JSON
            let json = null;
            try {
                json = JSON.parse(value);
            } catch (err) {
                app.say(to, 'I was unable to parse this value, please use json notation, wrap strings with ""');
                return;
            }

            // If we have anything other then an object but the original is an object
            if (exists && _.isObject(app.Config[key]) && !_.isObject(json)) {
                app.say(to, 'I can only replace a Object with another Object');
                return;
            }

            // If we have anything other then an array but the original is an array
            if (exists && _.isArray(app.Config[key]) && !_.isArray(json)) {
                app.say(to, 'I can only replace a Array with another Array');
                return;
            }

            // Set the value
            _.set(app.Config, key, json);

            // Create output
            const output = new typo.StringBuilder();
            output.appendBold('Set')
                .append(exists ? 'updating' : 'inserting')
                .insert(`config.${key} to`)
                .append(value);
            app.say(to, output.text);
        }
    });


    // Return the script info
    return scriptInfo;
};
