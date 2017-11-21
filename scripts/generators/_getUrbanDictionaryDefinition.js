const endPoint = 'http://www.urbandictionary.com/define.php';
const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');
const Logger = require('../../lib/logger');

module.exports = term => new Promise((resolve, reject) => {
    if (_.isUndefined(term) || !_.isString(term) || _.isEmpty(term)) return reject(new Error('Not enough arguments provided'));
    const url = `${endPoint}?term=${term}`;
    return xray(encodeURI(url), 'div.meaning')((err, results) => {
        // Error In Xray
        if (err) {
            logger.error('Error in _getUrbanDictionaryDefinition', {
                err,
            });
            return reject(new Error('Something went wrong fetching your results'));
        }
        // No results available
        if (_.isUndefined(results) || !_.isString(results) || _.isEmpty(results)) return reject(new Error(`No Results are available for ${term}`));
        // Strip new lines out of the results
        results = helpers.StripNewLine(results).trim();
        resolve({
            url: encodeURI(url),
            term: _.capitalize(term),
            definition: results,
        });
    });
});
