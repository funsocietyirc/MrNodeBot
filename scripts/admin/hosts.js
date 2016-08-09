'use strict';

const dns = require('dns');
const validator = require('validator');
const storage = require('node-persist');
const color = require('irc-colors');
const helpers = require('../../helpers');

/**
  Keep track of a list of ip addresses and resolve
  them when asked
  Commands: hosts [add del list]
**/
module.exports = app => {
    // Make sure the Hosts are loaded
    let Hosts = null;

    // Load the Admin list
    storage.getItem('hosts', (err, value) => {
        if (value) {
            Hosts = value;
        }
        // Default to owner nick if no admin list exists
        else {
            Hosts = [];
            storage.setItemSync('hosts', Hosts);
        }
    });

    const hostCmd = (to, from, text, message) => {
        var txtArray = text.split(' '),
            cmd = txtArray[0] || 'help',
            host = txtArray[1] || false;

        // User requested Help
        if (cmd === 'help') {
            app.Bot.say(from, helpers.TitleLine('hosts commands: add del list'));
            return;
        }

        if (cmd === 'add' || cmd === 'del') {

            // Check we got host input
            if (!host) {
                app.Bot.say(from, 'Host required for add or del commands');
                return;
            }

            // check it is valid
            if (!validator.isIP(host)) {
                app.Bot.say(from, 'You have specified an invalid host');
                return;
            }

            // Add a host
            if (cmd === 'add') {
                Hosts.push(host);
                storage.setItemSync('hosts', Hosts);
                app.Bot.say(from, `${host} has been added to the Hosts list`);
                return;
            }

            // Remove a host
            if (cmd === 'del') {
                var index = Hosts.indexOf(host);
                if (index > -1) {
                    Hosts.splice(index, 1);
                    storage.setItemSync('hosts', Hosts);
                    app.Bot.say(from, `${host} has been deleted to the Hosts list`);
                } else {
                    app.Bot.say(from, `${host} is not in the hosts list`);
                }
                return;
            }
        }

        // List the results
        if (cmd === 'list') {
            app.Bot.say(from, 'Generating Hosts list');
            Hosts.forEach(ip => {
                dns.reverse(ip, (err, domains) => {
                    if (err != null) {
                        let first = helpers.ColorHelpArgs(`[${ip}]`);
                        app.Bot.say(from, `${color.red.bold(ip)} : ${first}`);
                        return;
                    };
                    if (domains) {
                        domains.forEach(domain => {
                            var first = helpers.ColorHelpArgs(`[${domain}]`);
                            app.Bot.say(from, `${color.green.bold(ip)} : ${first}`);
                        });
                    }
                });
            });
        }
    };

    // Requires validator npm package
    app.Commands.set('hosts', {
        desc: '[command] list add del help',
        access: app.Config.accessLevels.admin,
        call: hostCmd
    });

};
