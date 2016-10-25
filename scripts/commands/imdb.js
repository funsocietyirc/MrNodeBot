'use strict';
const scriptInfo = {
    name: 'Imdb',
    file: 'imdb.js',
    desc: 'Get IMDB info by title',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const gen = require('../generators/_imdbData');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    const imdb = (to, from, text, message) => {
        if (!text || _.isEmpty(text)) {
            app.say(to, 'I require something to actually look up');
            return;
        }
        gen(text,'title')
            .then(data => {
                if (!data || data.Response == 'False') {
                    app.say(to, 'Your IMDB request rendered no results, better luck next time');
                    return;
                }
                app.say(to,
                    `${ircTypography.logos.imdb} ${data.Title} (${data.Year}) (https://www.imdb.com/title/${data.imdbID}) Released: ${data.Released} Runtime: ${data.Runtime} Genre: ${data.Genre} ` +
                    `Type: ${data.Type} Writer(s): ${data.Writer} Cast: ${data.Actors} Rating: ${data.imdbRating} Votes: ${data.imdbVotes} MetaScore: ${data.Metascore} Plot: ${data.Plot}`
                );
            })
            .catch(err => {
                console.log('IMDB Command Issue');
                console.dir(err);
                app.say(to, 'Something went wrong with the IMDB API');
            });
    };

    // Register IMDB Command
    app.Commands.set('imdb', {
        desc: '[title] - Get IMDB info for a given title',
        access: app.Config.accessLevels.identified,
        call: imdb
    });

    return scriptInfo;
};
