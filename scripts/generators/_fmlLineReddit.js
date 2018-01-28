const endPoint = 'https://www.reddit.com/r/FML/.json';
const _ = require('lodash');
const rp = require('request-promise-native');

module.exports = amount => rp({
    headers: {
        'user-agent': 'MrNodeBot',
    },
    uri: endPoint,
    json: true,
})
    .then(results => new Promise((resolve, reject) => {
        // We have No Data
        if (!_.has(results, 'data.children[0].data') || !results.data.children) {
            reject(new Error('No Data was available'));
            return;
        }
        resolve(_.sampleSize(_.map(results.data.children, 'data.selftext'), amount || 1));
    }));
