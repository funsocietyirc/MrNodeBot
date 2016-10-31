'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');

module.exports = amount => rp({
        headers: {
            'user-agent': 'MrNodeBot'
        },
        uri: `https://www.reddit.com/r/Showerthoughts/hot/.json`,
        json: true
    })
    .then(results => new Promise((resolve, reject) => {
        // We have No Data
        if (!_.has(results, 'data.children[0].data') || !results.data.children) {
            reject(new Error('No Data was available'));
            return;
        }
        console.dir(_.sampleSize(_.map(results.data.children, 'data.title'), amount || 1));
        resolve(_.sampleSize(_.map(results.data.children, 'data.title'), amount || 1));
    }));
