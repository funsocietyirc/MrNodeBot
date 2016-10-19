'use strict';

const scriptInfo = {
    name: 'Waston Alcamey',
    file: 'watsonAlcamey.js',
    desc: 'Test Script for watson analytics',
    createdBy: 'Dave Richer'
};

const AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');

const Models = require('bookshelf-model-loader');
const helpers = require('../../helpers');

const _ = require('lodash');

module.exports = app => {
    // Make sure we have everything we need
    if (!app.Config.apiKeys.watson.alchemy || !app.Config.apiKeys.watson.alchemy.apikey || !app.Database || !Models.Logging) {
        return scriptInfo;
    }

    const aL = new AlchemyLanguageV1({
        headers: {
            'X-Watson-Learning-Opt-Out': true
        },
        api_key: app.Config.apiKeys.watson.alchemy.apikey
    });


    const getResults = (nick, channel, limit) =>
        Models.Logging.query(qb => {
            qb
                .select(['text', 'timestamp'])
                .distinct('text')
                .where('from', 'like', nick)
                .andWhere('to', 'like', channel)
                .andWhere('text', 'not like', 's/%')
                .orderBy('timestamp', 'desc')
                .limit(limit || 500);
        })
        .fetchAll();

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
                        console.log('Sentiment Error:');
                        if (err) {
                            console.dir(err);
                        }
                        return;
                    }

                    // Log to console
                    // console.log(JSON.stringify(response, null, 2));

                    // Prepare the concepts
                    let concepts = _.map(response.concepts, 'text').join(', ');

                    // Prepare the taxonomy
                    let taxonomy = [];
                    _(response.taxonomy).map('label').map(value => _.filter(value.split('/')), n => true).uniq().each(value => {
                        _.each(value, item => {
                            taxonomy.push(item);
                        });
                    });
                    taxonomy = _.uniq(taxonomy).join(', ');

                    // Space helper
                    let space = () => ' - ';

                    // Prepare the output
                    let output = `${nick} is interested in concepts like: ${concepts}`;
                    output = output + space() + `Most of the time ${nick} is ${response.docSentiment.type}`;
                    output = output + space() + `They are also interested in: ${taxonomy}`;
                    output = output + space() + `There emotional state is: `;
                    _.each(response.docEmotions, (value, key) => {
                        output = output + ` ${_.capitalize(key)}: ${helpers.RoundNumber(value * 100)}%`
                    });

                    // Report back to IRC
                    app.say(to, output);
                });
            })
            .catch(err => {
                console.log('Combined Error:');
                console.dir(err);
            });
    };
    app.Commands.set('combined', {
        desc: '[Nick] [Channel] Get the combined information for a specified user',
        access: app.Config.accessLevels.admin,
        call: combined
    });


    return scriptInfo;
};
