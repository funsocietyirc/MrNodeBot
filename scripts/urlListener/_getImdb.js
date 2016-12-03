'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const gen = require('../generators/_imdbData');
const logger = require('../../lib/logger');

module.exports = (key, results) => new Promise(resolve => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key)) {
        resolve(results);
        return;
    }
    return gen(key, 'id')
        .then(data => {
            // No Data, or malformed data, bail
            if (!data || !data.Response || data.Response == 'False') {
                resolve(results);
                return;
            }

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
                actors: data.Actors.split(', '),
                plot: data.Plot,
                language: data.Language.split(', '),
                country: data.Country,
                awards: data.Awards,
                poster: data.Poster,
                metaScore: _.isSafeInteger(data.Metascore) ? null : data.Metascore,
                imdbRating: data.imdbRating,
                imdbVotes: data.imdbVotes,
                type: data.Type,
                seasons: data.totalSeasons
            };
            resolve(results);
        })
        .catch(err => {
            logger.error('Error in getImdb URL function', {
                err
            });
            resolve(results);
        });
});
