'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const gen = require('../generators/_imdbData');
const logger = require('../../lib/logger');

module.exports = (key, results) => new Promise(resolve => {
  // No Key provided, return the results
  if (!_.isString(key) || _.isEmpty(key)) return resolve(results);

  return gen(key, 'id')
    .then(data => {
      // No Data, or malformed data, bail
      if (!data || !data.Response || data.Response === 'False') return resolve(results);
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
        seasons: data.totalSeasons
      };
      // Record language
      results.imdb.language = !_.isUndefined(data.Language) && _.isString(data.Language) ? data.Language.split(', ') : [];
      // Record Actors
      results.imdb.actors = !_.isUndefined(data.Actors) && _.isString(data.Actors) ? data.Actors.split(', ') : [];
      // Record Metascore
      results.imdb.metaScore = !_.isUndefined(data.Metascore) && _.isSafeInteger(data.Metascore) ? data.Metascore : null;
      // return
      resolve(results);
    })
    .catch(err => {
      logger.warn('Error in getImdb URL function', {
        err
      });
      resolve(results);
    });
});
