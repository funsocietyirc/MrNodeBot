'use strict';

const scriptInfo = {
    name: 'Waston Alchemy Sentiment',
    file: 'sentiment.js',
    desc: 'Test Script for watson analytics',
    createdBy: 'Dave Richer'
};

const AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');
const Models = require('bookshelf-model-loader');

const _ = require('underscore');

module.exports = app => {
    // Make sure we have everything we need
    if(!app.Config.apiKeys.watson.alchemy || !app.Config.apiKeys.watson.alchemy.apikey || !app.Database || !Models.Logging) {
      return;
    }

    const aL = new AlchemyLanguageV1({
        api_key: app.Config.apiKeys.watson.alchemy.apikey
    });

    const sentiment = (to, from, text, message) => {
      let textArray = text.split(' ');
      let nick = [textArray];
      // No Nick Provided
      if(!text || !nick) {
        app.say(to, 'The sentiment command requires a Nick');
        return;
      }
    };

    app.Commands.set('sentiment', {
        desc: '[Nick] Get the sentiment information for a specified user',
        access: app.Config.accessLevels.admin,
        call: sentiment
    });

    return scriptInfo;
};
