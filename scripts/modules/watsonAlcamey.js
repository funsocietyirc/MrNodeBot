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
            'X-Watson-Learning-Opt-Out': '1'
        },
        api_key: app.Config.apiKeys.watson.alchemy.apikey
    });


    const getResults = (nick, channel) => Models.Logging.query(qb => {
            qb
                .select(['text', 'timestamp'])
                .distinct('text')
                .where('from','like', nick)
                .andWhere('to','like', channel)
                .andWhere('text', 'not like', 's/%')
                .orderBy('timestamp', 'desc')
                .limit(500);
        })
        .fetchAll();

        // Get the users overall sentiment
        const combined = (to, from, text, message) => {
            let textArray = text.split(' ');
            let [nick, channel] = textArray;
            // No Nick Provided
            if (!text || !nick || !channel) {
                app.say(to, 'The Combined command requires a Nick and a Channel');
                return;
            }
            getResults(nick, channel)
                .then(results => {
                    let data = _(results.pluck('text')).uniq().reverse().value();
                    if (!data) {
                        app.say(to, 'Something went wrong completing your combined command');
                        return;
                    }
                    aL.combined({
                        text: data.join('. '),
                        showSourceText: 1,
                        emotions:1,
                        knowledgeGraph:1,
                        maxRetrieve: 10,
                        extract: 'page-image,image-kw,feed,entity,keyword,taxonomy,concept,relation,pub-date,doc-sentiment,doc-emotion'
                    }, (err, response) => {
                        if (err || !response || response.status != 'OK') {
                            app.say(to, 'Something went wrong completing your combined command');
                            console.log('Sentiment Error:');
                            if (err) {
                                console.dir(err);
                            }
                            return;
                        }
                        //console.log(JSON.stringify(response, null, 2));

                        let concepts = _.map(response.concepts,'text');
                        app.say(to, `${nick} is interested in things like: ${concepts.join(', ')}`)

                        //app.say(to, `${nick} is that ${response.language} character who has been mostly ${response.docSentiment.type} on ${channel}`);
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

    // Get the users overall sentiment
    const sentiment = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [nick, channel] = textArray;
        // No Nick Provided
        if (!text || !nick || !channel) {
            app.say(to, 'The Sentiment command requires a Nick and a Channel');
            return;
        }
        getResults(nick, channel)
            .then(results => {
                let data = _(results.pluck('text')).uniq().reverse().value();
                if (!data) {
                    app.say(to, 'Something went wrong completing your sentiment command');
                    return;
                }
                aL.sentiment({
                    text: data.join(' ')
                }, (err, response) => {
                    if (err || !response || response.status != 'OK') {
                        app.say(to, 'Something went wrong completing your sentiment command');
                        console.log('Sentiment Error:');
                        if (err) {
                            console.dir(err);
                        }
                        return;
                    }
                    app.say(to, `${nick} is that ${response.language} character who has been mostly ${response.docSentiment.type} on ${channel}`);
                });
            })
            .catch(err => {
                console.log('Sentiment Error:');
                console.dir(err);
            });
    };
    app.Commands.set('sentiment', {
        desc: '[Nick] [Channel] Get the sentiment information for a specified user',
        access: app.Config.accessLevels.admin,
        call: sentiment
    });

    // Get the users emotion
    const emotion = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [nick, channel] = textArray;

        // No Nick Provided
        if (!text || !nick || !channel) {
            app.say(to, 'The Emotion command requires a Nick and a Channel');
            return;
        }

        getResults(nick, channel)
            .then(results => {
                let data = _(results.pluck('text')).uniq().reverse().value();
                if (!data) {
                    app.say(to, 'There is not enough data on this user to gauge their emotional state...hr');
                    return;
                }
                aL.emotion({
                    text: data.join(' ')
                }, (err, response) => {
                    if (err || !response || response.status != 'OK') {
                        app.say(to, 'Something went wrong completing your sentiment command');
                        console.log('Emotion Error:');
                        if (err) {
                            console.dir(err);
                        }
                        return;
                    }
                    let output = `The Emotional state of ${nick} on ${channel}`;
                    _.each(response.docEmotions, (value, key) => {
                        output = output + ` ${key}: ${helpers.RoundNumber(value * 100)}%`
                    });
                    app.say(to, output);
                });
            })
            .catch(err => {
                console.log('Emotion Error:');
                console.dir(err);
            });
    };
    app.Commands.set('emotion', {
        desc: '[Nick] [Channel] Get the emotion information for a specified user',
        access: app.Config.accessLevels.admin,
        call: emotion
    });


    return scriptInfo;
};
