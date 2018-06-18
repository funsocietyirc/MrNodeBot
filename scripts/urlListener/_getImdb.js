const _ = require('lodash');
const rp = require('request-promise-native');
const gen = require('../generators/_imdbData');
const logger = require('../../lib/logger');

const getImdb = async (key, results) => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) return results;
    try {
        const data = await gen(key, 'id');
        // No Data, or malformed data, bail
        if (!data || !data.Response || data.Response === 'False') return results;

        // Append Results
        results.imdb = {
            title: data.Title,
            year: data.Year,
            rated: data.Rated,
            released: data.Released,
            runtime: data.Runtime,
            genre: data.Genre,
            writer: data.Writer,
            director: data.Director,
            plot: data.Plot,
            country: data.Country,
            awards: data.Awards,
            poster: data.Poster,
            imdbRating: data.imdbRating,
            imdbVotes: data.imdbVotes,
            type: data.Type,
            seasons: data.totalSeasons,
            language: !_.isUndefined(data.Language) && _.isString(data.Language) ? data.Language.split(', ') : [],
            actors: !_.isUndefined(data.Actors) && _.isString(data.Actors) ? data.Actors.split(', ') : [],
            metaScore: !_.isUndefined(data.Metascore) && _.isSafeInteger(data.Metascore) ? data.Metascore : null,
        };

        return results;
    } catch (err) {
        logger.warn('Error in getImdb URL function', {
            message: err.message || '',
            stack: err.stack || '',
        });

        return results;
    }
};

module.exports = getImdb;
