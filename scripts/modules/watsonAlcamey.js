'use strict';
const scriptInfo = {
    name: 'Waston Alcamey',
    desc: 'Test Script for watson analytics',
    createdBy: 'IronY'
};

const AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');

const Models = require('bookshelf-model-loader');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const accounting = require('accounting-js');

const _ = require('lodash');

module.exports = app => {
    // Make sure we have everything we need
    if (!Models.Logging || // Database
        _.isUndefined(app.Config.apiKeys.watson.alchemy) || // configuration object
        !_.isString(app.Config.apiKeys.watson.alchemy.apikey) || _.isEmpty(app.Config.apiKeys.watson.alchemy.apikey) // configuration key
    ) return scriptInfo;

    // Space helper
    let space = ` ${typo.icons.sideArrow} `;

    const aL = new AlchemyLanguageV1({
        headers: {
            'X-Watson-Learning-Opt-Out': true
        },
        api_key: app.Config.apiKeys.watson.alchemy.apikey
    });

    const getResults = (nick, channel, limit) =>
        Models.Logging.query(qb => qb
            .select(['text', 'timestamp'])
            .distinct('text')
            .where('from', 'like', nick)
            .andWhere('to', 'like', channel)
            .andWhere('text', 'not like', 's/%')
            .orderBy('timestamp', 'desc')
            .limit(limit || 500)
        )
        .fetchAll();

    const whatsup = (to, from, text, message) => {
        let [channel] = text.split('. ');
        channel = channel || to;
        Models.Logging.query(qb =>
                qb
                .select(['text', 'timestamp'])
                .distinct('text')
                .where('to', 'like', channel)
                .orderBy('timestamp', 'desc')
                .limit(150)
            )
            .fetchAll()
            .then(results => {
                // No Results available
                if (!results.length) {
                    app.say(to, 'I do not have have any data on this channel');
                    return;
                }

                // Verify input
                let data = _(results.pluck('text')).uniq().reverse().value();
                if (!data) {
                    app.say(to, 'Something went wrong completing your combined command');
                    return;
                }

                // Run the Alchemy combined command
                aL.combined({
                    text: data.join(' '),
                    //showSourceText: 1, // Show Source Text for debugging
                    extract: 'taxonomy,concept,doc-sentiment,doc-emotion'
                }, (err, response) => {
                    if (err || !response || response.status != 'OK') {
                        app.say(to, 'Something went wrong completing your combined command');
                        logger.error('Sentiment Error', {
                            err
                        });
                        return;
                    }

                    // Prepare the concepts
                    let concepts = _.map(response.concepts, 'text').join(', ');

                    // Prepare the taxonomy
                    let taxonomy = [];
                    _(response.taxonomy).map('label').map(value => _.filter(value.split('/')), n => true).uniq().each(value => _.each(value, item => taxonomy.push(item)));

                    taxonomy = _.uniq(taxonomy).join(', ');

                    // Prepare the output
                    let output = `${channel} is interested in concepts like: ${concepts}`;
                    output = output + space + `Most of the time ${channel} is ${response.docSentiment.type}`;
                    output = output + space + `They are also interested in: ${taxonomy}`;
                    output = output + space + `The emotional state of ${channel} is: `;
                    _.each(response.docEmotions, (value, key) => output = output + ` ${_.capitalize(key)}: ${accounting.toFixed(value * 100,0)}%`);
                    // Report back to IRC
                    app.say(to, output);
                });

            })
            .catch(err => logger.error('Error In Whats Up', {
                err
            }));
    };
    app.Commands.set('whatsup', {
        desc: '[Channel?] Get the combined information for a specified channel (defaults to current channel)',
        access: app.Config.accessLevels.identified,
        call: whatsup
    });

    // Get the users overall sentiment
    const combined = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [nick, channel, limit] = textArray;
        // No Nick Provided
        if (!text || !nick || !channel) {
            app.say(to, 'The Combined command requires a Nick and a Channel');
            return;
        }
        getResults(nick, channel, limit)
            .then(results => {
                let data = _(results.pluck('text')).uniq().reverse().value();
                if (!data) {
                    app.say(to, 'Something went wrong completing your combined command');
                    return;
                }
                aL.combined({
                    text: data.join('. '),
                    //showSourceText: 1, // Show Source Text for debugging
                    extract: 'taxonomy,concept,doc-sentiment,doc-emotion'
                }, (err, response) => {
                    if (err || !response || response.status != 'OK') {
                        app.say(to, 'Something went wrong completing your combined command');
                        logger.error('Sentiment Error', {
                            err
                        });
                        return;
                    }

                    // Prepare the concepts
                    let concepts = _.map(response.concepts, 'text').join(', ');

                    // Prepare the taxonomy
                    let taxonomy = [];
                    _(response.taxonomy).map('label').map(value => _.filter(value.split('/')), n => true).uniq().each(value => _.each(value, item => taxonomy.push(item)));

                    taxonomy = _.uniq(taxonomy).join(', ');

                    // Prepare the output
                    let output = `${nick} is interested in concepts like: ${concepts}`;
                    output = output + space + `Most of the time ${nick} is ${response.docSentiment.type}`;
                    output = output + space + `They are also interested in: ${taxonomy}`;
                    output = output + space + `Their emotional state is: `;
                    _.each(response.docEmotions, (value, key) => output = output + ` ${_.capitalize(key)}: ${accounting.toFixed(value * 100,0)}%`);

                    // Report back to IRC
                    app.say(to, output);
                });
            })
            .catch(err => logger.error('Combined Error', {
                err
            }));
    };
    app.Commands.set('combined', {
        desc: '[Nick] [Channel] Get the combined information for a specified user',
        access: app.Config.accessLevels.identified,
        call: combined
    });

    return scriptInfo;
};
