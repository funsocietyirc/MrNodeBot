'use strict';
const endPoint = 'https://www.omdbapi.com';
const _ = require('lodash');
const rp = require('request-promise-native');
const config = require('../../config');

// Accept call types
const validTypes = [
    'title', // Get movie by Title
    'id' // Get Movie By Name
];


// Build the Request Options object
const getRpOptions = (text, type) => {
    switch (type) {
        case 'id':
            return {
                uri: endPoint,
                json: true,
                qs: {
                    plot: 'short',
                    r: 'json',
                    i: text,
                    apikey: config.apiKeys.omdb || '',
                }
            };
        case 'title':
        default:
            return {
                uri: endPoint,
                json: true,
                qs: {
                    t: text,
                    plot: 'short',
                    r: 'json',
                    apikey: config.apiKeys.omdb || '',
                }
            };
    }
};

// Export the generator
module.exports = (text, type) => {
    // No Key available, throw error
    if (!_.isString(config.apiKeys.omdb) || _.isEmpty(config.apiKeys.omdb)) {
        throw new Error('The OMDB API key is missing');
    }

    [type] = type.split(' ');
    return rp(getRpOptions(text, _.includes(validTypes, type) ? type : validTypes[0]));
};
