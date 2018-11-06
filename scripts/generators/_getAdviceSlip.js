const _ = require('lodash');
const rp = require('request-promise-native');

const endPoint = 'https://api.adviceslip.com/';

module.exports = async (searchTerm) => {
        const termPresent = _.isString(searchTerm) && !_.isEmpty(searchTerm);
        // Fetch
        const results = termPresent ?
            await rp({uri: `${endPoint}advice/search/${encodeURI(searchTerm)}`, json: true}) :
            await rp({uri: `${endPoint}advice`, json: true});

        // There is no results
        if (!_.isObject(results)) return null;

        if (termPresent) {
            return (!_.isArray(results.slips) || !results.slips || !results.slips[0].advice) ? null : results.slips[0].advice
        }
        return (!_.isObject(results.slip) || !results.slip.advice) ? null: results.slip.advice;
};
