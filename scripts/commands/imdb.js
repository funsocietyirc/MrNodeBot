'use strict';
const scriptInfo = {
    name: 'Imdb',
    desc: 'Get IMDB info by title',
    createdBy: 'IronY'
};

const _ = require('lodash');
const gen = require('../generators/_imdbData');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');
const short = require('../lib/_getShortService');

module.exports = app => {
    // Register IMDB Command
    app.Commands.set('imdb', {
        desc: '[title] - Get IMDB info for a given title',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            if (!_.isString(text) || _.isEmpty(text)) {
                app.say(to, 'I require something to actually look up');
                return;
            }
            gen(text, 'title')
                .then(data => {
                    if (!data || data.Response == 'False') {
                        app.say(to, 'Your IMDB request rendered no results, better luck next time');
                        return;
                    }
                    let output = new ircTypography.StringBuilder({
                        logo: 'imdb',
                    });
                    console.dir(app._ircClient.supported)
                    return short(`https://www.imdb.com/title/${data.imdbID}`)
                        .then(shortUrl => {
                            output
                                .append(data.Title)
                                .append(data.Year)
                                .append(shortUrl)
                                .append(`Released: ${data.Released}`)
                                .append(`Runetime: ${data.Runtime}`)
                                .append(`Genre: ${data.Genre}`).append(`Type: ${data.Type}`)
                                .append(`Writer(s): ${data.Writer}`)
                                .append(`Cast: ${data.Actors}`).append(`Rating: ${data.imdbRating}`)
                                .append(`Votes: ${data.imdbVotes}`)
                                .append(`MetaScore ${data.Metascore}`);
                            app.say(to, output.text);
                            app.say(to, `${ircTypography.c.bold('Plot:')} ${data.Plot}`);
                        });
                })
                .catch(err => {
                    logger.error('IMDB Command Issue', {
                        err
                    });
                    app.say(to, 'Something went wrong with the IMDB API');
                });
        }
    });

    return scriptInfo;
};
