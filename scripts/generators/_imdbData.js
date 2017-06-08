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


// Base Options for IMDB
const baseOptions = {
    uri: endPoint,
    qs: {
        plot: 'short',
        r: 'json',
        apikey: config.apiKeys.omdb || '',
    },
    json: true
};

// Build the Request Options object
const getRpOptions = (text, type) => {
    switch (type) {
        case 'id':
            return Object.assign(baseOptions, {
                qs: {
                    i: text
                }
            });
        case 'title':
        default:
            return Object.assign(baseOptions, {
                qs: {
                    t: text
                }
            });
    }
};

// Export the generator
module.exports = (text, type) => {
    [type] = type.split(' ');
    return rp(getRpOptions(text, _.includes(validTypes, type) ? type : validTypes[0]));
};
