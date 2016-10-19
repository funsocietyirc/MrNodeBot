'use strict';

const scriptInfo = {
    name: 'Waston Alcamey',
    file: 'watsonAlcamey.js',
    desc: 'Test Script for watson analytics',
    createdBy: 'Dave Richer'
};

const AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');

const Models = require('bookshelf-model-loader');

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
                .where('from', 'like', nick)
                .andWhere('to', 'like', channel)
                .orderBy('timestamp', 'desc')
                .limit(500);
        })
        .fetchAll();

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

    const round = (num, decimals) => {
        var t = Math.pow(10, decimals);
        return (Math.round((num * t) + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
    }

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
                    app.say(to, 'Something went wrong completing your sentiment command');
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
                        output = output + ` ${key}: ${round(value * 100,2)}%`
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
