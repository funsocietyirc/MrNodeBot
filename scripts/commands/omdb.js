const scriptInfo = {
    name: 'OMDB',
    desc: 'Get OMDB info by title',
    createdBy: 'IronY',
};
const _ = require('lodash');
const gen = require('../generators/_imdbData');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');
const short = require('../lib/_getShortService')();

module.exports = (app) => {
    // No OMDB API key provided
    if (!_.isString(app.Config.apiKeys.omdb) || _.isEmpty(app.Config.apiKeys.omdb)) return scriptInfo;

    // Register OMDB Command
    app.Commands.set('omdb', {
        desc: '[title] - Get OMDB info for a given title',
        access: app.Config.accessLevels.identified,
        call: async (to, from, text, message) => {
            if (!_.isString(text) || _.isEmpty(text)) {
                app.say(to, 'I require something to actually look up');
                return;
            }
            try {
                const data = await gen(text, 'title');
                if (!data || data.Response === 'False') {
                    app.say(to, 'Your OMDB request rendered no results, better luck next time');
                    return;
                }
                const output = new ircTypography.StringBuilder({
                    logo: 'imdb',
                });

                const shortUrl = await short(`https://www.imdb.com/title/${data.imdbID}`);

                // Report back to IRC
                output
                    .append(data.Title)
                    .append(data.Year)
                    .append(shortUrl)
                    .append(`Released: ${data.Released}`)
                    .append(`Run-time: ${data.Runtime}`)
                    .append(`Genre: ${data.Genre}`)
                    .append(`Type: ${data.Type}`)
                    .append(`Writer(s): ${data.Writer}`)
                    .append(`Cast: ${data.Actors}`)
                    .append(`Rating: ${data.imdbRating}`)
                    .append(`Votes: ${data.imdbVotes}`)
                    .append(`MetaScore ${data.Metascore}`);
                app.say(to, output.text);
                app.say(to, `${ircTypography.c.bold('Plot:')} ${data.Plot}`);
            } catch (err) {
                logger.error('OMDB Command Issue', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
                app.say(to, `Something went wrong with the OMDB API, ${from}`);
            }
        },
    });

    return scriptInfo;
};
