'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const getTitle = require('./_getTitle');

module.exports = (key, results) => {
    // Bail if we have no result
    if (!key || _.isEmpty(key)) {
        return results;
    }

    return rp({
            uri: 'https://www.omdbapi.com',
            qs: {
                i: key,
                plot: 'short',
                r: 'json'
            },
            json: true
        })
        .then(data => {
            if (!data) {
                return getTitle(results.url, results);
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
            return (results);
        })
        .catch(err => {
            return getTitle(results);
            console.dir(err);
        })
};
