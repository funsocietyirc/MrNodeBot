'use strict';
const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const extract = require('../../lib/extractNickUserIdent');
const logger = require('../../lib/logger');
const Moment = require('moment');

const saidCats = ['log', 'action', 'notice'];

module.exports = (input, options) => new Promise((res, rej) => {
    // Extract user information
    let args = null;
    // We have a string, parse it
    if (_.isString(input)) args = extract(input);
    // We were passed an object
    else if (_.isObject(input)) args = input;
    // We were given an array
    else if (_.isArray(input)) args = Object.create({
        nick: input[0],
        user: input[1],
        host: input[2],
        channel: input[3]
    });

    // Deal with options
    options = _.isObject(options) ? options : Object.create(null);
    // By default sort descending for the last result
    if (_.isUndefined(options.descending) || !_.isBoolean(options.descending)) options.descending = true;
    // Grab user
    let nick = args.nick;
    let user = args.user;
    let host = args.host;
    let channel = args.channel;

    // Gate
    if (!Models.Logging || !Models.NoticeLogging || !Models.ActionLogging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return rej({
        args,
        inner: new Error('no database available'),
    });

    // We have no user
    if (!nick && !user && !host) return rej({
        args,
        inner: new Error('no results'),
    });

    // Query filter
    const filter = (qb, nickField = 'nick', userField = 'user', channelField = 'channel') => {
        if (nick) qb.andWhere(nickField, 'like', nick);
        if (user) qb.andWhere(userField, 'like', user);
        if (host) qb.andWhere('host', 'like', host);
        if (channel) qb.andWhere(channelField, 'like', `%${channel}%`);
        // Order
        return qb.orderBy('timestamp', options.descending ? 'desc' : 'asc').limit(1);
    };

    // Render object
    const render = (result, key) => {
        if (!result || !key) return;
        let output = Object.create(null);
        output = result.toJSON();
        output.key = key;
        return output;
    };

    // Tabulate results
    const tabulateResults = results => {
        // Invalid Results
        if (!_.isArray(results) || _.isEmpty(results)) return {
            args,
            finalResults: []
        };

        // Remove undefined / falsey values
        let _results = _(results).compact();
        let lastSaid = _results.filter(r => _.includes(saidCats, r.key))[options.descending ? 'maxBy' : 'minBy'](r => Moment(r.timestamp).unix());
        let lastAction = _results.reject(r => _.includes(saidCats, r.key))[options.descending ? 'maxBy' : 'minBy'](r => Moment(r.timestamp).unix());
        let finalResults = _results.value();

        // Build the outputs
        let output = {
            args,
            lastSaid,
            finalResults,
        };

        // Only return the action if it happened after the last said
        if (
            _.isObject(lastSaid) &&
            _.isObject(lastAction) &&
            !_.isUndefined(lastSaid.timestamp) &&
            !_.isUndefined(lastAction.timestamp) &&
            Moment(lastAction.timestamp).isAfter(Moment(lastSaid.timestamp))
        ) output.lastAction = lastAction;

        return output;
    };

    // Resolve all the queries, process the results, report any errors
    return res(Promise.all([
            Models.Logging.query(qb => filter(qb, 'from', 'ident', 'to')).fetch().then(result => render(result, 'log')),
            Models.JoinLogging.query(filter).fetch().then(result => render(result, 'join')),
            Models.PartLogging.query(filter).fetch().then(result => render(result, 'part')),
            Models.QuitLogging.query(qb => filter(qb, 'nick', 'user', 'channels')).fetch().then(result => render(result, 'quit')),
            Models.KickLogging.query(filter).fetch().then(result => render(result, 'kick')),
            Models.Alias.query(qb => filter(qb, 'oldnick', 'user', 'channels')).fetch().then(result => render(result, 'aliasOld')),
            Models.Alias.query(qb => filter(qb, 'newnick', 'user', 'channels')).fetch().then(result => render(result, 'aliasNew')),
            Models.ActionLogging.query(qb => filter(qb, 'from', 'user', 'to')).fetch().then(result => render(result, 'action')),
            Models.NoticeLogging.query(qb => filter(qb, 'from', 'user', 'to')).fetch().then(result => render(result, 'notice')),
        ])
        .then(tabulateResults));

});
