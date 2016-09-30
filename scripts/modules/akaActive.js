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
        const titleLine = text => c.underline.red.bgblack(text);
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
        const renderData = (nick, subCommand, dbResults, whoisResults, locResults) => {
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
                subCommand: subCommand
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
                _.merge(result, {
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
                const sayHelper = (header, content) => {
                        app.say(to, `${titleLine(rightPad(`${header}${header ? ':' : ' '}`, pad, ' '))} ${contentLine(content)}`);
                };
                const firstDateActive = Moment(data.firstResult.timestamp);
                const lastDateActive = Moment(data.lastResult.timestamp);
                const pad = 19;
                const realName = data.realName ? `(${c.white.bgblack(data.realName)})` : '';
                const primaryNick = data.primaryNick ? `${c.white.bgblack.bold('ACC: ')}${c.green.bgblack(data.primaryNick)}` : c.red.bgblack('-Unidentified-');
                const city = data.city ? `City(${data.city}) ` : '';
                const regionName = data.regionName ? `Region(${data.regionName}) ` : '';
                const countryName = data.countryName ? `Country(${data.countryName}) ` : '';
                const postal = data.postal ? `Postal(${data.postal}) ` : '';
                const timeZone = data.timeZone ? `Time Zone(${data.timeZone}) ` : '';
                const lat = data.lat ? `Lat(${data.lat}) ` : '';
                const long = data.long ? `Long(${data.long}) ` : '';

                app.say(to, `${c.underline.red.bgblack(rightPad(`Searching VIA ${data.subCommand}`, pad * 4, ' '))}`);
                app.say(to, `${primaryNick} ${c.white.bgblack.bold('Current:')} ${c.white.bgblack(data.currentNick)}!${c.red.bgblack(data.currentIdent)}@${c.blue.bgblack.bold(data.currentHost)} ${realName}`);

                sayHelper('Nicks', data.nicks.join(' | '));
                sayHelper('Past Channels', data.pastChannels.join(' | '));
                sayHelper('Current Channels', data.currentChannels.join(' | '));
                sayHelper('Hosts', data.hosts.join(' | '));
                sayHelper('Idents', data.idents.join(' | '));
                sayHelper('Server', `${data.currentServer} ` + (data.secureServer ? '(SSL)' : '(Plain Text)'));
                sayHelper('First Active', `as ${data.firstResult.from} on ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
                sayHelper('First Message', data.firstResult.text);
                sayHelper('Last Active', `as ${data.lastResult.from} on ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
                sayHelper('Last Message', data.lastResult.text);

                if (city || regionName || countryName || postal || timeZone || lat || long) {
                    sayHelper('Location Data', `${city}${regionName}${countryName}${postal}${timeZone}${lat}${long}`);
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
        qb.select(['id', 'timestamp', 'ident', 'from', 'to', 'host','text']);
        qb.where(field, 'like', value);
    }).fetchAll();

    // Get the location data
    const getLocationData = (host) =>
      new Promise((resolve, reject) =>
        reqPromise({
          method: 'GET',
          uri: `http://freegeoip.net/json/${host}`,
          json: true
        })
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          resolve(false);
        }));

    const init = (to, nick, subCommand, processor) => {
      // Send Whois Command
      app._ircClient.whois(nick, whoisResults => {
          // Verify Info object
          if (!whoisResults || !Object.keys(whoisResults).length || !whoisResults.user || !whoisResults.host) {
              app.say(to, `${nick} has evaded our tracking..`);
              return;
          }
          getLocationData(whoisResults.host)
          .then(locResults => {
            queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)])
              .then(dbResults => {
                if(!dbResults.length) {
                  app.say(to, `I am afraid I do not have enought data...`);
                  return;
                }
                processor(to, renderData(nick, subCommand, dbResults.toJSON(), whoisResults, locResults));
              });
            })
          .catch(err => {
            console.log(err);
          });
      });
    };

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

        init(to, nick, subCommand, reportToIrc);
    };

    app.Commands.set('aka-active', {
        desc: '[Nick] [Sub Command] - Advanced Analytics tool',
        access: app.Config.accessLevels.admin,
        call: akaActive
    });

    // Return the script info
    return scriptInfo;
};
