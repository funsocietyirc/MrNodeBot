'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const endPoint = 'https://api.chucknorris.io/jokes/random';

module.exports = amount => rp({
        uri: endPoint,
        json: true
    })
    .then(results => new Promise((resolve, reject) => {
        // We have No Data
        if (!results || !results.value || !_.isString(results.value)) {
            reject(new Error('Seems Chuck Norris broke his own website with a refresh'));
            return;
        }
        resolve(results.value);
    }));
