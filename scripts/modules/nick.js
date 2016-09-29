'use strict';
const scriptInfo = {
    name: 'nick',
    file: 'nick.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
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
                moment: require('moment')
            });
        });
    };

    const akaActive = (to, from, text, message) => {
        // Bail if there is no argument
        text = text.split(' ');
        if (!text) {
            app.say(to, 'No one is no one is no one is no one, ad infinitum...');
            return;
        }

        // Parse Text
        const subCommand = text.splice(0, 1)[0];
        const nick = text.splice(0, 1)[0];
        console.log(subCommand);

        if (!subCommand || !nick) {
            app.say(to, 'Both a Sub Command and a Nick are required');
            return;
        }

        // Check for valid commands
        const validCommands = ['ident', 'host'];
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

            let convertSub = () => {
              switch (subCommand) {
                case 'ident':
                  return 'user';
              }
              return subCommand;
            };

            Models.Logging.query(qb => {
              qb.where(subCommand, 'like', info[convertSub()]);
            }).fetchAll().then(results => {
                let sorted = results.toJSON();
                //sorted = _(sorted).uniqBy(subCommand).value();
                let nicks = _(sorted).map('from').uniq();
                let channels = _(sorted).map('to').uniq();
                let hosts = _(sorted).map('host').uniq()
                let idents = _(sorted).map('ident').uniq()
                app.say(to, `${nick}!${info.user}@${info.host} goes a little like this...`);
                app.say(to, `Nicks: ${nicks.join(',')}`);
                app.say(to, `Past Channels: ${channels.join(',')}`);
                let currentChannels = info.channels ? info.channels.join(',') : '';
                app.say(to, `Current Channels: ${currentChannels}`);
                app.say(to, `Hosts: ${hosts.join(',')}`);
                app.say(to, `Idents: ${idents.join(',')}`);
                let currentServer = info.server ? info.server : '';
                app.say(to, `Server: ${currentServer}`);
            });


            // Info Contents
            // {
            //     nick: "Ned",
            //     user: "martyn",
            //     host: "10.0.0.18",
            //     realname: "Unknown",
            //     channels: ["@#purpledishwashers", "#blah", "#mmmmbacon"],
            //     server: "*.dollyfish.net.nz",
            //     serverinfo: "The Dollyfish Underworld",
            //     operator: "is an IRC Operator"
            // }
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
