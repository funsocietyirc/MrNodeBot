const scriptInfo = {
    name: 'help',
    desc: 'Dynamically created help system',
    createdBy: 'IronY',
};
const _ = require('lodash');
const color = require('irc-colors');
const helpers = require('../../helpers');
const defaultVueOptions = require('../lib/_defaultVueOptions');
// Provide User help
// Commands: help list
module.exports = (app) => {
    const list = (to, from, text, message) => {
        app.say(from, color.white.bggray.bold(`${app._ircClient.nick} has the following commands available.`));

        const out = [];
        app.Commands.forEach((value, key) => {
            if (
                app.Commands.get(key).access !== app.Config.accessLevels.admin &&
                app.Commands.get(key).access !== app.Config.accessLevels.owner
            ) out.push(`${color.bgwhite.black.bold(key)} ${helpers.ColorHelpArgs(value.desc)}`);
        });
        app.say(from, out.join(' -> '));
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

    /**
     * Command Handler
     * @param req
     * @param res
     */
    const commandHandler = (req, res) => {
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Commands',
            }
        });
        res.renderVue('commands.vue', {
            results: [...app.Commands].map(x => ({
                desc: x[1].desc,
                command: x[0],
                access: helpers.AccessString(x[1].access),
            }))
        }, req.vueOptions);
    };

    // Provide Web Route for a command listing
    app.webRoutes.associateRoute('commands', {
        handler: commandHandler,
        desc: 'Commands',
        path: '/commands',
        navEnabled: true,
        navPath: '/commands',
    });

    /**
     * Scripts Handler
     * @param req
     * @param res
     */
    const scriptsHandler = (req, res) => {

        // Return sorted result
        const results = _(app.LoadedScripts).map('info').map(x => {
            // Assure sensible defaults
            x.lastUpdated.date = x.lastUpdated.date || 'Unknown';
            x.lastUpdated.author = x.lastUpdated.author || 'Unknown';
            x.lastUpdated.subject = x.lastUpdated.subject || 'Unknown';
            x.lastUpdated.email = x.lastUpdated.email || 'Unknown';
            return x;
        }).compact().sortBy(dateObj => new Date(dateObj.lastUpdated.rawDate)).value();

        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Scripts',
            }
        });
        res.renderVue('scripts.vue', {
            results
        }, req.vueOptions);
    };

    // Provide Web Route for script listing
    app.webRoutes.associateRoute('scripts', {
        handler: scriptsHandler,
        desc: 'Scripts',
        path: '/scripts',
        navEnabled: true,
        navPath: '/scripts'
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
