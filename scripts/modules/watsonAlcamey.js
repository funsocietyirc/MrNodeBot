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


    const sentiment = (to, from, text, message) => {
        // Make sure we have everything we need
        if (!app.Config.apiKeys.watson.alchemy || !app.Config.apiKeys.watson.alchemy.apikey || !app.Database || !Models.Logging) {
            return;
        }

        const aL = new AlchemyLanguageV1({
            headers: {
                'X-Watson-Learning-Opt-Out': '1'
            },
            showSourceText: 1,
            api_key: app.Config.apiKeys.watson.alchemy.apikey
        });

        let textArray = text.split(' ');
        let [nick, channel] = textArray;
        // No Nick Provided
        if (!text || !nick || !channel) {
            app.say(to, 'The Sentiment command requires a Nick and a Channel');
            return;
        }
        Models.Logging.query(qb => {
                qb
                    .select(['text', 'timestamp'])
                    .where('from', 'like', nick)
                    .andWhere('to', 'like', channel)
                    .orderBy('timestamp', 'desc')
                    .limit(250);
            })
            .fetchAll()
            .then(results => {
                let data = _(results.pluck('text')).uniq().reverse().value();
                if (!data) {
                    app.say(to, 'Something went wrong completing your sentiment command');
                    return;
                }
                console.log(data.join(' '));
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
                    app.say(from, `${nick} is that ${response.language} character who has been mostly ${response.docSentiment.type} on ${channel}`);
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

    const question = (to, from, text, message) => {
        if (!text) {
            app.say(from, 'The answer to nothing is nothing....');
            return;
        }

    };

    return scriptInfo;
};
