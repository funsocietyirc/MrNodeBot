'use strict';
const scriptInfo = {
    name: 'nick',
    file: 'nick.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const Moment = require('moment');

const _ = require('lodash');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Alias) {
        return;
    }

    // Grab Model
    const aliasModel = Models.Alias;

    // Handler
    const nickChange = (oldnick, newnick, channels, message) => {
        // If we have a database connection, log
        aliasModel.create({
                oldnick: oldnick,
                newnick: newnick
            })
            .catch(err => {
                console.log(err.message);
            });
    };

    // Web front end
    const frontEnd = (req, res) => {
        aliasModel.fetchAll().then(results => {
            res.render('nickchanges', {
                results: results.toJSON(),
                moment: Moment
            });
        });
    };

    const akaActive = (to, from, text, message) => {
        // No Text
        if (!text) {
            app.say(to, 'No one is no one is no one is no one, ad infinitum...');
            return;
        }

        // Bail if there is no argument
        text = text.split(' ');

        // Parse Text
        const subCommand = text.splice(0, 1)[0];
        const nick = text.splice(0, 1)[0];
        console.log(subCommand);

        if (!subCommand || !nick) {
            app.say(to, 'Both a Sub Command and a Nick are required');
            return;
        }

        // Check for valid commands
        const validCommands = ['ident', 'host', 'nick'];
        if (validCommands.indexOf(subCommand) == -1) {
            app.say(to, 'That is not a valid Sub Command silly');
            return;
        }

        // Send Whois Command
        app._ircClient.whois(nick, info => {
            // Verify Info object
            if (!info || !Object.keys(info).length || !info.user || !info.host) {
                app.say(to, `${nick} has evaded our tracking..`);
                return;
            }

            // Handle info verbiage
            let convertSubInfo = () => {
                switch (subCommand) {
                    case 'ident':
                        return 'user';
                }
                return subCommand;
            };

            // Handle query verbiage
            let convertSubFrom = () => {
                switch (subCommand) {
                    case 'nick':
                        return 'from'
                }
                return subCommand;
            };

            Models.Logging.query(qb => {
                qb
                  .select(['id','timestamp','ident','from','to','host'])
                  .where(convertSubFrom(), 'like', info[convertSubInfo()])
                  .orderBy('timestamp','desc');
            })
            .fetchAll()
            .then(results => {
                // No results
                if (!results) {
                    app.say(to, `I am afraid I do not have enought data...`);
                }

                // Parse data
                let sorted = results.toJSON();
                let nicks = _(sorted).map('from').uniq();
                let channels = _(sorted).map('to').uniq();
                let hosts = _(sorted).map('host').uniq();
                let idents = _(sorted).map('ident').uniq();
                let currentChannels = info.channels ? info.channels.join(',') : '';
                let currentServer = info.server ? info.server : '';
                let lastActive = Moment(sorted[0].timestamp).format('h:mma MMM Do');

                // Display data
                app.say(to, `${nick}!${info.user}@${info.host} goes a little like this...`);
                app.say(to, `Nicks: ${nicks.join(',')}`);
                app.say(to, `Past Channels: ${channels.join(',')}`);
                app.say(to, `Current Channels: ${currentChannels}`);
                app.say(to, `Hosts: ${hosts.join(',')}`);
                app.say(to, `Idents: ${idents.join(',')}`);
                app.say(to, `Server: ${currentServer}`);
                app.say(to, `Last Active: ${lastActive}`);
            });
        });
    };

    // List known nicks for a given alias
    const aka = (to, from, text, message) => {
        if (!text) {
            app.say(to, `No one is no one is no one...`);
            return;
        }
        Models.Alias
            .query(qb => {
                qb
                    .distinct('newnick')
                    .where('oldnick', 'like', text)
                    .select('newnick');
            })
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, 'I have no data on that alias...');
                    return;
                }
                let nicks = results.pluck('newnick').join(' | ');
                app.say(to, `${text} is also known as: ${nicks}`);
            });
    };

    app.Commands.set('aka', {
        desc: '[alias] get known aliases',
        access: app.Config.accessLevels.identified,
        call: aka
    });

    app.Commands.set('aka-active', {
        desc: '[Sub Command] [nick]',
        access: app.Config.accessLevels.admin,
        call: akaActive
    });

    // Listen and Log
    app.NickChanges.set('databaseLogging', {
        desc: 'Log Nick changes to the alias table',
        call: nickChange
    });

    // Web Front End
    app.WebRoutes.set('nickchanges', {
        handler: frontEnd,
        path: '/nickchanges',
        desc: 'Nick Changes',
        name: 'nickchanges'
    });

    // Return the script info
    return scriptInfo;
};
