'use strict';
const scriptInfo = {
    name: 'akaActive',
    file: 'akaActive.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const Moment = require('moment');

const _ = require('lodash');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Logging) {
        return;
    }

    /**
      Render the data object
    **/
    const renderData = (nick, dbResults, whoisResults) => {
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
            result.currentChannels = whoisResults.channels ? whoisResults.channels.join(',') : '';
            result.currentServer = whoisResults.server || '';
            result.currentIdent = whoisResults.user || '';
            result.currentHost = whoisResults.host || '';
            result.primaryNick = whoisResults.account || '';
            result.secureServer = whoisResults.secure || '';
        }
        return result;
    };

    /**
      Report the data back to IRC
    **/
    const reportToIrc = (to, data) => {
        // Display data
        let firstDateActive =  Moment(data.firstResult.timestamp);
        let lastDateActive =  Moment(data.lastResult.timestamp);

        app.say(to, `${data.currentNick}!${data.currentIdent}@${data.currentHost} goes a little like this...`);
        if(data.primaryNick) {
          app.say(to, `Primary Nick: ${data.primaryNick}`);
        }
        app.say(to, `Nicks: ${data.nicks.join(',')}`);
        app.say(to, `Past Channels: ${data.pastChannels.join(',')}`);
        app.say(to, `Current Channels: ${data.currentChannels}`);
        app.say(to, `Hosts: ${data.hosts.join(',')}`);
        app.say(to, `Idents: ${data.idents.join(',')}`);
        app.say(to, `Server: ${data.currentServer} ` + (data.secureServer ? '(Secure Connection)' : ''));
        app.say(to, `First Active: ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
        app.say(to, `Last Active: ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
        app.say(to, `Total Lines Associated: ${data.totalLines}`);
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
        text = text.split(' ');

        // Parse Text
        const subCommand = text.splice(0, 1)[0];
        const nick = text.splice(0, 1)[0];

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
        desc: '[Sub Command] [nick]',
        access: app.Config.accessLevels.admin,
        call: akaActive
    });

    // Return the script info
    return scriptInfo;
};
