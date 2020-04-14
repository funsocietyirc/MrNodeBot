const scriptInfo = {
    name: 'Bot Utilities',
    desc: 'Bot administrative commands',
    createdBy: 'IronY',
};
const _ = require('lodash');
const gen = require('../generators/_showerThoughts');
const typo = require('../lib/_ircTypography');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const preprocessText = require('../../lib/preprocessText');

module.exports = app => {
    /**
     * Rename Handler
     * @param to
     * @param from
     * @param text
     */
    const renameHandler = (to, from, text) => {
        const oldNick = app.nick;
        if (app.nick === text || _.isEmpty(text)) {
            app.say(to, `I am already ${app.nick}, what else would you like me to go by ${from}`);
            return;
        }
        app.nick = text;
        app.say(from, `I was once ${oldNick} but now I am ${app.nick}... The times, they are changing.`);
    };
    // Change the bots nick
    app.Commands.set('rename', {
        desc: '[nick] Rename the Bot',
        access: app.Config.accessLevels.owner,
        call: renameHandler,
    });

    /**
     * Drunk Handler
     * @param to
     */
    const drunkHandler = (to) => {
        // The Key Already Exists
        app.Config.drunk = _.isBoolean(app.Config.drunk)
            ? !app.Config.drunk
            : true;

        app.say(to, app.Config.drunk
            ? 'I am suddenly feeling very tipsy'
            : 'Well that was interesting...');
    };
    app.Commands.set('drunk', {
        desc: 'It\'s party time',
        access: app.Config.accessLevels.owner,
        call: drunkHandler,
    });

    /**
     * Slicced Handler
     * @param to
     */
    const sliccedHander = (to) => {
        // The Key Already Exists
        app.Config.slicced = _.isBoolean(app.Config.slicced)
            ? !app.Config.slicced
            : true;

        app.say(to, app.Config.slicced
            ? 'Lets Do this!'
            : 'back to normal...');
    };
    app.Commands.set('slicced', {
        desc: 'It\'s awesome yoh!',
        access: app.Config.accessLevels.owner,
        call: sliccedHander,
    });

    /**
     * Channels Handler
     * @param to
     * @param from
     */
    const channelsHandler = (to, from) => app.say(from, `I am currently on the following channels: ${app.channels.join(', ')}`);
    app.Commands.set('channels', {
        desc: 'Get a list of the current joined channels',
        access: app.Config.accessLevels.owner,
        call: channelsHandler,
    });

    /**
     * Config Get Handler
     * @param to
     * @param from
     * @param text
     */
    const configGetHandler = (to, from, text) => {
        if (_.isEmpty(text)) {
            app.say(to, `You need to provide me with a key ${from}`);
            return;
        }
        const [key] = text.split(' ');
        if (!_.has(app.Config, key)) {
            app.say(to, `I do not have the config setting: ${key}, ${from}`);
            return;
        }
        app.say(to, `The config value you requested [${key}] is ${JSON.stringify(_.get(app.Config, key, ''))}`);
    };
    app.Commands.set('conf-get', {
        desc: '[key] - Get a configuration key',
        access: app.Config.accessLevels.owner,
        call: configGetHandler,
    });

    /**
     * Spawn Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const spawnHandler = async (to, from, text) => {
        // Parse arguments
        const inputArr = text.split(' ');
        const nick = inputArr[0];

        // Make sure we have a default amount
        const amount = _.isSafeInteger(parseInt(inputArr[1]))
            ? parseInt(inputArr[1])
            : 1;

        /// Search Text Seed
        const seed = inputArr.slice(2, inputArr.length).join(' ');

        // Clone and modify initial config
        const config = _.cloneDeep(app.Config);

        // Set Nick
        config.irc.nick = (!_.isString(nick) || _.isEmpty(nick))
            ? app.nick
            : nick;

        // Hold on to initial nick
        config.irc.originalNick = config.irc.nick;

        // Reset variables
        config.irc.password = '';
        config.irc.sasl = false;
        config.irc.channels = [];

        // Reset Features
        config.features = {};

        // Action to channel
        app.action(to, 'focuses real hard');

        // Check if nick is already in channel
        const originalNickIsActive = app._ircClient.isInChannel(to, nick);

        // Create IRC Instance
        const instance = new app._ircClient.Client(config.irc.server, config.irc.nick, config.irc);

        // Connect
        instance.connect(() => {
            const lowerNick = _.toLower(instance.nick);

            // Add to ignore list
            const wasIgnored = lowerNick in app.Ignore;

            if (!wasIgnored) {
                app.Ignore.push(lowerNick);
            }
            instance.join(to, () => gen(amount).then(results => Models.Logging.query(
                qb => qb
                    .select('text')
                    // .where('from', 'like', nick)
                    .where(clause => {
                        clause.where('from', 'like', nick);
                        // Filter Out links
                        clause.andWhereNot('text', 'like', '%http://%');
                        clause.andWhereNot('text', 'like', '%https://%');
                        // Conditionally Filter based on seed text
                        if (!_.isEmpty(seed)) clause.andWhere('text', 'like', `%${seed}%`);
                    })
                    .orderByRaw('rand()')
                    .limit(amount))
                .fetchAll().then(logs => new Promise(res => {
                    // Hold All The Promises
                    const promises = [];
                    let key = 0;

                    // The person we are spawning is in the channel
                    if (originalNickIsActive) {
                        promises.push(new Promise(r => setTimeout(() => r(instance.say(to, preprocessText(`Well hello ${config.irc.originalNick}, seems there are two of us`, config))), ++key * 2500)));
                    }

                    // Join delay delay
                    promises.push(new Promise(r => setTimeout(r, ++key * 5000)));

                    // We have no results
                    if (!logs.length) {
                        _.each(results, result => promises.push(new Promise(r => setTimeout(() => r(instance.say(to, preprocessText(result, config))), ++key * 2500))));
                    } // We have results
                    else {
                        _.each(logs.toJSON(), log => promises.push(new Promise(r => setTimeout(() => r(instance.say(to, preprocessText(log.text, config))), ++key * 2500))));
                    }

                    // Part delay
                    promises.push(new Promise(r => setTimeout(r, ++key * 5000)));

                    // Iterate over promises
                    return Promise.all(promises).then(res);
                })).then(() =>
                    // Leave the channel
                    instance.part(to, 'I was only but a dream', () => {
                        // Disconnect
                        instance.disconnect('Vici Vidi Vici');
                        // Remove temp name from ignore list
                        if (!wasIgnored) {
                            _.remove(app.Ignore, lowerNick);
                        }
                    }))
                // We have an error
                .catch((err) => {
                    logger.error('Something went wrong in the botUtils spawn command', {err});
                    app.say('Something did not go quite right...');
                })));
        });
    };
    app.Commands.set('spawn', {
        desc: '[nick] [ [amount?] [seed?] ] Will conjure someone magically',
        access: app.Config.accessLevels.owner,
        call: spawnHandler,
    });

    /**
     * Conf Set Handler
     * @param to
     * @param from
     * @param text
     */
    const confSetHandler = (to, from, text) => {
        // Make sure we have text
        if (!_.isString(text) || _.isEmpty(text)) {
            app.say(to, `I need a value to set ${from}`);
            return;
        }

        // Get Key Value pair
        const matches = text.match(/(\S+)\s(.*)/im);

        if (!matches || !matches[1] || !matches[2]) {
            app.say(to, `I need a key and a value ${from}`);
            return;
        }

        // Config Key
        const key = matches[1];
        // Config Value in JSON
        const value = matches[2].replace(/'/g, '"');
        // Does the key already exist in the config store
        const exists = _.has(app.Config, key);
        const defaultValue = _.get(app.Config, key);

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
    };
    app.Commands.set('conf-set', {
        desc: '[key value] - Manipulate config values',
        access: app.Config.accessLevels.owner,
        call: confSetHandler,
    });

    // Return the script info
    return scriptInfo;
};
