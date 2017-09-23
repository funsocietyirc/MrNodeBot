'use strict';
const scriptInfo = {
    name: 'Watson Alchemy',
    desc: 'Test Script for watson analytics',
    createdBy: 'IronY'
};
const _ = require('lodash');
const rp = require('request-promise-native');
const typo = require('../lib/_ircTypography');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const helpers = require('../../helpers');
const accounting = require('accounting-js');
const moment = require('moment');

// const AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

module.exports = app => {

    // Make sure we have everything we need
    if (!Models.Logging || // Database
        _.isUndefined(app.Config.apiKeys.watson.alchemy) || // configuration object
        !_.isString(app.Config.apiKeys.watson.alchemy.username) || _.isEmpty(app.Config.apiKeys.watson.alchemy.username) ||
        !_.isString(app.Config.apiKeys.watson.alchemy.password) || _.isEmpty(app.Config.apiKeys.watson.alchemy.password) // configuration key
    ) return scriptInfo;

    // Space helper
    const space = ` ${typo.icons.sideArrow} `;

    // // Watson Alchemy Client
    // const aL = new AlchemyLanguageV1({
    //     headers: {
    //         'X-Watson-Learning-Opt-Out': true
    //     },
    //     api_key: app.Config.apiKeys.watson.alchemy.apikey
    // });

    const nlu = new NaturalLanguageUnderstandingV1({
        username: app.Config.apiKeys.watson.alchemy.username,
        password: app.Config.apiKeys.watson.alchemy.password,
        version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
    });

    const plu = new PersonalityInsightsV3({
        username: app.Config.apiKeys.watson.personality.username,
        password:  app.Config.apiKeys.watson.personality.password,
        version_date: '2016-10-19'
    });

    // Results Promise
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

    const personality = async (to, from, text, message) => {
        const [input] = text.split(' ');
       const user  = input || from;
        try {
            const results = await Models.Logging.query(qb => qb
                .select(['id', 'text', 'timestamp'])
                .distinct('text')
                .where('from', 'like', user)
                .andWhere('text', 'not like', 's/%')
                .orderBy('timestamp', 'desc')
                .limit(1000)
            )
                .fetchAll();

            if(!results.length) {
                app.say(to, `I have no personality data for ${user}, ${from}`);
                return;
            }

            const output = {
                headers: { Accept: 'application/json' },
                contentItems: [],
            };

            results.forEach(result => {
                output.contentItems.push({
                    content: result.attributes.text,
                    contenttype: 'text/plain',
                    created: result.attributes.timestamp,
                    id: result.attributes.id,
                    language: 'en'
                });
            });

            console.dir(JSON.stringify(output));


        } catch (err) {
                app.say(to, `Something went wrong with the personality stuffs, ${from}`);
                logger.error('Error In personality function of watsonAlchemy', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
        }

    };

    // Register Command
    app.Commands.set('personality', {
        desc: '[Nick?] Get personality insights for use',
        access: app.Config.accessLevels.admin,
        call: personality
    });


    const whatsUp = async (to, from, text, message) => {
        let [channel] = text.split('. ');
        channel = channel || to;

        try {
            const results = await getResults(from, to, 500);
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

            nlu.analyze({
                text: data.join(' '),
                features: {
                    'entities': {
                        'emotion': true,
                        'sentiment': true,
                        'concepts': true,
                        'limit': 5,
                    },
                    'keywords': {
                        'sentiment': true,
                        'emotion': true,
                        'limit': 5
                    },
                    'concepts': {
                        'limit': 5
                    }
                }
            }, (err, response) => {
                console.dir(err);
                console.dir(response);
            });

            // Run the Alchemy combined command
            // aL.combined({
            //     text: data.join(' '),
            //     //showSourceText: 1, // Show Source Text for debugging
            //     extract: 'taxonomy,concept,doc-sentiment,doc-emotion'
            // }, (err, response) => {
            //     // Issue with Alchemy Response
            //     if (err || !response || response.status !== 'OK') {
            //         app.say(to, 'Something went wrong completing your combined command');
            //         logger.error('Sentiment Error', {
            //             message: err.message || '',
            //             stack: err.stack || '',
            //         });
            //         return;
            //     }
            //
            //     // Prepare the concepts
            //     let concepts = _.map(response.concepts, 'text').join(', ');
            //
            //     // Prepare the taxonomy
            //     let taxonomy = [];
            //     _(response.taxonomy).map('label').map(value => _.filter(value.split('/')), n => true).uniq().each(value => _.each(value, item => taxonomy.push(item)));
            //
            //     taxonomy = _.uniq(taxonomy).join(', ');
            //
            //     // Prepare the output
            //     let output = `${channel} is interested in concepts like: ${concepts}`;
            //     output = output + space + `Most of the time ${channel} is ${response.docSentiment.type}`;
            //     output = output + space + `They are also interested in: ${taxonomy}`;
            //     output = output + space + `The emotional state of ${channel} is: `;
            //     _.each(response.docEmotions, (value, key) => output = output + ` ${_.capitalize(key)}: ${accounting.toFixed(value * 100, 0)}%`);
            //
            //     // Report back to IRC
            //     app.say(to, output);
            // });

        }
        catch (err) {
            logger.error('Error In Whats Up', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };

    // Register Command
    app.Commands.set('whatsup', {
        desc: '[Channel?] Get the combined information for a specified channel (defaults to current channel)',
        access: app.Config.accessLevels.admin,
        call: whatsUp
    });

    // Get the users overall sentiment
    const combined = async (to, from, text, message) => {
        const [nick, channel, limit] = text.split(' ');

        // No Nick Provided
        if (!text || !nick || !channel) {
            app.say(to, 'The Combined command requires a Nick and a Channel');
            return;
        }

        try {
            const results = await getResults(nick, channel, limit);
            let data = _(results.pluck('text')).uniq().reverse().value();

            // No Data provided
            if (!data) {
                app.say(to, 'Something went wrong completing your combined command');
                return;
            }

            // // Send To Alchemy
            // aL.combined({
            //     text: data.join('. '),
            //     //showSourceText: 1, // Show Source Text for debugging
            //     extract: 'taxonomy,concept,doc-sentiment,doc-emotion'
            // }, (err, response) => {
            //     if (err || !response || response.status !== 'OK') {
            //         app.say(to, 'Something went wrong completing your combined command');
            //         logger.error('Sentiment Error', {
            //             message: err.message || '',
            //             stack: err.stack || '',
            //         });
            //         return;
            //     }
            //
            //     // Prepare the concepts
            //     let concepts = _.map(response.concepts, 'text').join(', ');
            //
            //     // Prepare the taxonomy
            //     const taxonomy = [];
            //     _(response.taxonomy).map('label').map(value => _.filter(value.split('/')), n => true).uniq().each(value => _.each(value, item => taxonomy.push(item)));
            //
            //     // Filter the taxonomy down to unique, join into string
            //     const taxonomyResults = _.uniq(taxonomy).join(', ');
            //
            //     // Prepare the output
            //     let output = `${nick} is interested in concepts like: ${concepts}`;
            //     output = output + space + `Most of the time ${nick} is ${response.docSentiment.type}`;
            //     output = output + space + `They are also interested in: ${taxonomyResults}`;
            //     output = output + space + `Their emotional state is: `;
            //
            //     // Iterate and append results
            //     _.each(response.docEmotions, (value, key) => output = output + ` ${_.capitalize(key)}: ${accounting.toFixed(value * 100, 0)}%`);
            //
            //     // Report back to IRC
            //     app.say(to, output);
            // });

        }
        catch (err) {
            logger.error('Combined Error', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }

    };
    // Register Command
    app.Commands.set('combined', {
        desc: '[Nick] [Channel] Get the combined information for a specified user',
        access: app.Config.accessLevels.admin,
        call: combined
    });

    return scriptInfo;
};
