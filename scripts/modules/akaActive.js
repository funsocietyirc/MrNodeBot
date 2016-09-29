'use strict';
const scriptInfo = {
    name: 'akaActive',
    file: 'akaActive.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const Moment = require('moment');
const _ = require('lodash');
const c = require('irc-colors');
const rightPad = require('right-pad');


module.exports = app => {
        // No Database Data available...
        if (!app.Database && !Models.Logging) {
            return;
        }

        /**
          Render the data object
        **/
        const renderData = (nick, dbResults, whoisResults) => {
            console.log(whoisResults);
            let db = _(dbResults);
            let result = {
                currentNick: nick,
                nicks: db.map('from').uniq(),
                pastChannels: db.map('to').uniq(),
                hosts: db.map('host').uniq(),
                idents: db.map('ident').uniq(),
                firstResult: db.first(),
                lastResult: db.last(),
                totalLines: db.size(),
            }
            if (whoisResults) {
                _.merge(result, {
                    currentChannels: whoisResults.channels || [],
                    currentServer: whoisResults.server || '',
                    currentIdent: whoisResults.user || '',
                    currentHost: whoisResults.host || '',
                    primaryNick: whoisResults.account || '',
                    secureServer: whoisResults.secure || '',
                    realName: whoisResults.realname || '',
                });
            }
            return result;
        };

        /**
          Report the data back to IRC
        **/
        const titleLine = text => c.white.bgblack(text);
        const contentLine = text => text
          .replaceAll('|', c.red.bgblack.bold('|'))
          .replaceAll('(', c.red.bgblack.bold('('))
          .replaceAll(')', c.red.bgblack.bold(')'))
          .replaceAll('#', c.white.bgblack('#'))
          .replaceAll('@', c.blue.bgblack('@'))
          .replaceAll('~', c.green.bgblack('~'));

        const reportToIrc = (to, data) => {
                // Display data
                const sayHelper = (header, content) => {
                        app.say(to, `${titleLine(rightPad(`${header}${header ? ':' : ' '}`, pad, ' '))} ${contentLine(content)}`);
        };

        const firstDateActive = Moment(data.firstResult.timestamp);
        const lastDateActive = Moment(data.lastResult.timestamp);
        const pad = 19;
        const realName = data.realName ? `(${data.realName})` : '';
        const primaryNick = data.primaryNick ? `${data.primaryNick}` : 'Unidentified';

        app.say(to, `${c.red.bgblack(rightPad('Preparing to h4x0r....', pad + 5, ' '))}`)
        sayHelper(`${primaryNick} (Identified)`, `${data.currentNick}!${data.currentIdent}@${data.currentHost} ${realName}`);
        sayHelper('Nicks', data.nicks.join(' | '));
        sayHelper('Past Channels', data.pastChannels.join(' | '));
        sayHelper('Current Channels', data.currentChannels.join(' | '));
        sayHelper('Hosts', data.hosts.join(' | '));
        sayHelper('Idents', data.idents.join(' | '));
        sayHelper('Server', `${data.currentServer} ` + (data.secureServer ? '(Secure Connection)' : ''));
        sayHelper('First Active', `as ${data.firstResult.from} on ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
        sayHelper('Last Active', `as ${data.lastResult.from} on ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
        sayHelper('Total Lines', `${contentLine(data.totalLines)}`);
    };

    // Handle info verbiage
    const convertSubInfo = (val) => {
        switch (val) {
            case 'ident':
                return 'user';
        }
        return val;
    };

    // Handle query verbiage
    const convertSubFrom = (val) => {
        switch (val) {
            case 'nick':
                return 'from'
        }
        return val;
    };

    // Build the initial query
    const queryBuilder = (field, value) => Models.Logging.query(qb => {
        qb.select(['id', 'timestamp', 'ident', 'from', 'to', 'host']);
        qb.where(field, 'like', value);
    }).fetchAll();

    /**
      Trigger command for advanced active tracking
    **/
    const akaActive = (to, from, text, message) => {
        // Bail if there is no argument
        const args = text.split(' ');

        // Parse Text
        const nick = args.splice(0, 1)[0];
        const subCommand = args.splice(0, 1)[0];


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
        app._ircClient.whois(nick, whoisResults => {
            // Verify Info object
            if (!whoisResults || !Object.keys(whoisResults).length || !whoisResults.user || !whoisResults.host) {
                app.say(to, `${nick} has evaded our tracking..`);
                return;
            }
            queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)])
                .then(results => {
                    // No results
                    if (!results) {
                        app.say(to, `I am afraid I do not have enought data...`);
                        return;
                    }
                    reportToIrc(to, renderData(nick, results.toJSON(), whoisResults));
                });
        });
    };

    app.Commands.set('aka-active', {
        desc: '[Nick] [Sub Command] - Advanced Analytics tool',
        access: app.Config.accessLevels.admin,
        call: akaActive
    });

    // Return the script info
    return scriptInfo;
};
