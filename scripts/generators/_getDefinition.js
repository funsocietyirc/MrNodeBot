'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const endPoint = 'https://wordsapiv1.p.mashape.com/words';
const config = require("../../config");

module.exports = async (word) => {
    if(!_.isString(config.apiKeys.mashape) || _.isEmpty(config.apiKeys.mashape)) {
        throw new Error('No Mashape key available');
    }
    try {
        const results = await rp({
            uri: `${endPoint}/${word}`,
            json: true,
            headers: {
                'X-Mashape-Key': config.apiKeys.mashape || '',
            }
        });
        console.dir(results);
    } catch (err) {
        const error = new Error('Something went wrong getting a definition');
        error.innerErr = err;
        throw error;
    }
};
