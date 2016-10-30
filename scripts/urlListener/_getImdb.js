'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const gen = require('../generators/_imdbData');

module.exports = (key, results) => !key || _.isEmpty(key) ? results :
gen(key, 'id')
    .then(data => {
      console.dir(data);
        if (!data || !data.Response || data.Response == 'False') {
            return results;
        }
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
        return results;
    })
    .catch(err => {
        console.dir(err);
        return results;
    });
