'use strict';
const scriptInfo = {
    name: 'analyze',
    desc: 'Get a summary of information from a online IRC user',
    createdBy: 'IronY'
};
const _ = require('lodash');
const c = require('irc-colors');
const Models = require('bookshelf-model-loader');
const Moment = require('moment');
const getLocationData = require('../generators/_ipLocationData');

const errorMessage = 'Something went wrong fetching your results';
const locationErrorMessage = 'Something went wrong fetching your location results';

module.exports = app => {
    // No Database Data available...
    if (!app.Database && !Models.Logging) return;

    // Helpers
    const titleLine = text => c.underline.red.bgblack(text);

    // Render the Data object
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
        };

        if (whoisResults) {
            Object.assign(result, {
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
            Object.assign(result, {
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

    // Report back to IRC
    const reportToIrc = async (to, data) => {
        const sayHelper = (header, content) => {
            let paddedResult = _.padEnd(`${header}${header ? ':' : ' '}`, pad, ' ');
            app.notice(to, `${titleLine(paddedResult)} ${content}`);
        };

        let firstDateActive = _.isUndefined(data.firstResult.timestamp) ? null : Moment(data.firstResult.timestamp);
        let lastDateActive = _.isUndefined(data.lastResult.timestamp) ? null : Moment(data.lastResult.timestamp);

        let pad = 19;
        let realName = data.realName ? `(${c.white.bgblack(data.realName)})` : '';
        let primaryNick = data.primaryNick ? `${c.white.bgblack.bold('ACC: ')}${c.green.bgblack(data.primaryNick)}` : c.red.bgblack('-Unident/Offline-');
        let city = data.city ? `City(${data.city}) ` : '';
        let regionName = data.regionName ? `Region(${data.regionName}) ` : '';
        let countryName = data.countryName ? `Country(${data.countryName}) ` : '';
        let postal = data.postal ? `Postal(${data.postal}) ` : '';
        let timeZone = data.timeZone ? `Time Zone(${data.timeZone}) ` : '';
        let lat = data.lat ? `Lat(${data.lat}) ` : '';
        let long = data.long ? `Long(${data.long}) ` : '';
        let paddedResult = _.padStart(`Searching VIA ${data.subCommand}`, pad * 4, ' ');
        app.notice(to, `${c.underline.red.bgblack(paddedResult)}`);
        app.notice(to, `${primaryNick} ${c.white.bgblack.bold('Current:')} ${c.white.bgblack(data.currentNick)}!${c.red.bgblack(data.currentIdent)}@${c.blue.bgblack.bold(data.currentHost)} ${realName}`);

        sayHelper('Nicks', data.nicks.join(' | '));
        sayHelper('Past Channels', data.pastChannels.join(' | '));
        if (!_.isEmpty(data.currentChannels)) sayHelper('Current Channels', data.currentChannels.join(' | '));
        sayHelper('Hosts', data.hosts.join(' | '));
        sayHelper('Idents', data.idents.join(' | '));
        if (data.currentServer) sayHelper('Server', `${data.currentServer} ` + (data.secureServer ? '(SSL)' : '(Plain Text)'));

        if (firstDateActive) {
            sayHelper('First Active', `as ${data.firstResult.from} on ${firstDateActive.format('h:mma MMM Do')} (${firstDateActive.fromNow()}) On: ${data.firstResult.to}`);
            sayHelper('First Message', data.firstResult.text);
        }

        if (lastDateActive) {
            sayHelper('Last Active', `as ${data.lastResult.from} on ${lastDateActive.format('h:mma MMM Do')} (${lastDateActive.fromNow()}) On: ${data.lastResult.to}`);
            sayHelper('Last Message', data.lastResult.text);
        }

        // Display location data if it exists
        if (city || regionName || countryName || postal || timeZone || lat || long) {
            sayHelper('Location Data', `${city}${regionName}${countryName}${postal}${timeZone}${lat}${long}`);
        }

        sayHelper('Total Lines', `${data.totalLines}`);
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
        qb.select(['id', 'timestamp', 'ident', 'from', 'to', 'host', 'text']);
        qb.where(field, 'like', value);
    }).fetchAll();

    const init = async (to, nick, subCommand, argument, processor) => {

        // Verify Info object
        if (!nick) {
            app.say(to, `A Nick is required`);
            return;
        }

        // Hold whois results
        let whoisResults;

        try {
            whoisResults = await app._ircClient.whoisPromise(nick);
        } catch (err) {
            app.say(to, err.message);
            return;
        }

        // Insignificant information
        if (!whoisResults || (!whoisResults.user && subCommand === 'ident')) {
            app.say(to, 'The user is either offline or I do not have any information on them');
            return;
        }

        whoisResults.host = whoisResults.host || argument;
        whoisResults.user = whoisResults.user || nick;

        if (!whoisResults.host || !whoisResults.user) {
            // Hold Results
            let results;

            try {
                results = await Models.Logging.query(qb => qb
                    .where('from', 'like', whoisResults.user)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                )
                    .fetch();
            } catch (err) {
                app.say(to, errorMessage);
                return;
            }

            console.dir(results);
            if (!results) {
                app.say(to, 'No results are available');
                return;
            }

            whoisResults.host = whoisResults.host || results.get('host');
            whoisResults.user = whoisResults.user || results.get('ident');

            // Hold on to the dbResults
            let dbResults;
            try {
                dbResults = await queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)]);
            } catch (err) {
                app.say(to, errorMessage);
                return;
            }

            console.dir(dbResults);
            if(!dbResults) {
                app.say(to, 'No results are available');
                return;
            }

            // Hold on to the location results
            let locResults = null;
            try {
                let locResults = await getLocationData(whoisResults.host);
            } catch (err) {
                // Ignore Error
            }
            finally {
                processor(to, renderData(nick, subCommand, dbResults.toJSON(), whoisResults, locResults));
            }

        } else {
            // Hold on to the dbResults
            let dbResults;
            try {
                dbResults = await queryBuilder(convertSubFrom(subCommand), whoisResults[convertSubInfo(subCommand)]);
            }
            catch (err) {
                app.say(to, errorMessage);
                return;
            }

            console.dir(dbResults);
            if(!dbResults) {
                app.say(to, 'No results are available');
                return;
            }

            whoisResults.host = whoisResults.host || _.last(dbResults).get('host');

            // Hold on to the location results
            let locResults;
            try {
                locResults = await getLocationData(whoisResults.host);
            }
            catch (err) {
                // Ignore Error
            }
            finally {
                processor(to, renderData(nick, subCommand, dbResults.toJSON(), whoisResults, locResults));
            }

        }
    };

    /**
     Trigger command for advanced active tracking
     **/
    const analyze = async (to, from, text, message) => {
        // Parse Text
        let txtArray = text.split(' ');
        let nick = txtArray.shift();
        let subCommand = txtArray.shift();
        let argument = txtArray.shift();

        if (nick === app.nick) {
            app.say(from, 'I have never really been good at self analysis');
            return;
        }

        if (!subCommand || !nick) {
            app.say(to, 'Both a Sub Command and a Nick are required');
            return;
        }

        // Check for valid commands
        if (!_.includes(['ident', 'host', 'nick'], subCommand)) {
            app.say(to, 'That is not a valid Sub Command silly');
            return;
        }

        init(to, nick, subCommand, argument, reportToIrc);
    };

    app.Commands.set('analyze', {
        desc: '[Nick] [Sub Command] - Advanced Analytics tool',
        access: app.Config.accessLevels.admin,
        call: analyze
    });

    // Return the script info
    return scriptInfo;
};
