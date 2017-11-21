const scriptInfo = {
    name: 'help',
    desc: 'Dynamically created help system',
    createdBy: 'IronY',
};
const color = require('irc-colors');
const _ = require('lodash');
const helpers = require('../../helpers');

// Provide User help
// Commands: help list
module.exports = (app) => {
    const list = (to, from, text, message) => {
        app.say(from, color.white.bggray.bold(`${app._ircClient.nick} has the following commands available.`));

        app.Commands.forEach((value, key) => {
            if (
                app.Commands.get(key).access !== app.Config.accessLevels.admin &&
                app.Commands.get(key).access !== app.Config.accessLevels.owner
            ) app.say(from, `${color.bgwhite.black.bold(key)} ${helpers.ColorHelpArgs(value.desc)}`);
        });

        if (to !== from) app.say(to, `The list has been sent to you ${from}, please consider messaging me directly next time`);
    };

    const help = (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(from, color.white.bggray.bold(`${app._ircClient.nick} has the following commands available.`));
            const keys = [];
            app.Commands.forEach((value, key) => {
                if (
                    value.access !== app.Config.accessLevels.admin &&
                    value.access !== app.Config.accessLevels.owner
                ) keys.push(key);
            });
            app.say(from, keys.join(', '));
            app.say(from, color.white.bggray.bold('Use help <command> for more information'));
            if (to !== from) app.say(to, `${from} I have messaged you my instructions. Be gentle.`);
        } else {
            const textArray = text.split(' ');
            const [cmd] = textArray;
            if (app.Commands.has(cmd)) {
                const cmdObj = app.Commands.get(cmd);
                if (!cmdObj[2]) app.say(from, `${color.bgwhite.black.bold(cmd)} ${helpers.ColorHelpArgs(cmdObj.desc)}`);
            } else app.say(from, `${cmd} is not a valid command`);
        }
    };

    // Provide Web Route for a command listing
    app.WebRoutes.set('commands', {
        desc: 'Command Listing',
        path: '/commands',
        handler: (req, res) => {
            const results = [];

            app.Commands.forEach((value, key) =>
                results.push({
                    desc: value.desc,
                    command: key,
                    access: helpers.AccessString(value.access),
                }));

            res.render('commands', {
                results: _.sortBy(results, ['access', 'command']),
            });
        },
    });

    // Provide Web Route for script listing
    app.WebRoutes.set('scripts', {
        desc: 'Script Listing',
        path: '/scripts',
        handler: (req, res) => {
            // Return sorted result
            const results = _(app.LoadedScripts).map('info').compact().sortBy('name')
                .value();
            res.render('scripts', {
                // Do not expose full path
                results,
            });
        },
    });

    // List of available commands
    app.Commands.set('list', {
        desc: 'Verbose list of all commands and descriptions',
        access: app.Config.accessLevels.guest,
        call: list,
    });

    // Provide commands and take a command as an argument for more information
    // Basically a less spammy version of list
    app.Commands.set('help', {
        desc: '[command] provides a short list of commands or details on a specified command',
        access: app.Config.accessLevels.guest,
        call: help,
    });

    // Return the script info
    return scriptInfo;
};
