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
const reqPromise = require('request-promise-native');

module.exports = app => {
        // No Database Data available...
        if (!app.Database && !Models.Logging) {
            return;
        }

        /**
          Helpers
        **/
        const validHosts = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
        const titleLine = text => c.underline.white.bgblack(text);
        const contentLine = text => {
            return text
                .replaceAll('|', c.red.bgblack.bold('|'))
                .replaceAll('(', c.red.bgblack.bold('('))
                .replaceAll(')', c.red.bgblack.bold(')'))
                .replaceAll('#', c.white.bgblack('#'))
                .replaceAll('@', c.blue.bgblack('@'))
                .replaceAll('~', c.green.bgblack('~'))
                .replaceAll('!', c.yellow.bgblack('!'));
        };
        /**
          Render the data object
        **/
        const renderData = (nick, dbResults, whoisResults, locResults) => {
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
                totalLines: db.size().toString(),
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
            if (locResults) {
              _merge(result, {
                countryCode: locResults.country_code || '',
                countryName: locResults.country_name || '',
                regionCode: locResults.region_code || '',
                regionName: locResults.region_name || '',
                city: locResults.city || '',
                postal: locResults.zip_code || '',
                timeZone: locResults.time_zone || '',
                lat: locResults.latitude || '',
                long: locResults.longitude || ''
              });
            }
            return result;
        };

        /**
          Report the data back to IRC
        **/
        const reportToIrc = (to, data) => {
                // Display data
                const sayHelper = (header, content) => {
                        app.say(to, `${titleLine(rightPad(`${header}${header ? ':' : ' '}`, pad, ' '))} ${contentLine(content)}`);
        };

        const firstDateActive = Moment(data.firstResult.timestamp);
        const lastDateActive = Moment(data.lastResult.timestamp);
        const pad = 19;
        const realName = data.realName ? `(${data.realName})` : '';
        const primaryNick = data.primaryNick ? `${data.primaryNick}` : '-(Unidentified)-';
        const seedText = '{Filling tubes....|Connecting To Gibsons...|Following white rabbit...|Articulaiting Splines}';

        app.say(to, `${c.underline.red.bgblack(rightPad('Hello Friend...', pad * 4, ' '))}`);
        sayHelper(`${primaryNick}`, `${data.currentNick}!${data.currentIdent}@${data.currentHost} ${realName}`);
        sayHelper('Nicks', data.nicks.join(' | '));
        sayHelper('Past Channels', data.pastChannels.join(' | '));
        sayHelper('Current Channels', data.currentChannels.join(' | '));
        sayHelper('Hosts', data.hosts.join(' | '));
        sayHelper('Idents', data.idents.join(' | '));
        sayHelper('Server', `${data.currentServer} ` + (data.secureServer ? '(SSL)' : '(Plain Text)'));
        sayHelper('First Active', `as ${data.firstResult.from} on ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
        sayHelper('Last Active', `as ${data.lastResult.from} on ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
        if(data.city && data.regionName && data.countyName) {
          sayHelper('Logged In From', `${data.city}, ${data.regionName}, ${data.countryName}`);
        }
        if(data.postal && data.timeZone && data.lat && data.long) {
          sayHelper('Misc', `Time Zone: ${data.timeZone} Postal: ${data.postal} Lat: ${data.lat} Long: ${data.long}`);
        }
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
            new Promise((resolve, reject) => {
              return reqPromise({
                method: 'GET',
                uri: `http://freegeoip.net/json/${whoisResults.host}`,
                json: true
              })
              .then(result => {
                resolve(result);
              })
              .catch(err => {
                resolve(false);
              });
            })
            .then(locResults => {
              queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)])
                .then(dbResults => {
                  if(!dbResults.length) {
                    app.say(to, `I am afraid I do not have enought data...`);
                    return;
                  }
                  //console.log(dbResults.toJSON(), whoisResults, locResults);
                  reportToIrc(to, renderData(nick, dbResults.toJSON(), whoisResults, locResults));
                });
              })
            .catch(err => {
              console.log(err);
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
