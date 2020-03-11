const _ = require('lodash');
const scraper = require('table-scraper');
const logger = require('../../lib/logger');

// End Points
const endPoint = 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html';

const getOfficialCanadianData = async () => {
    try {
        const results = await scraper.get(endPoint);
        const output = {};

        // No Data Available
        if (_.isEmpty(results) || _.isEmpty(results[0])) {
            return output;
        }

        // Build output
       _.forEach(results[0], x => {
           if(x['Province or territory'] === 'Total cases:') {
               output.total = _.toNumber(x['Confirmed cases']);
           }
           else {
               output[_.toLower(x['Province or territory'])] = _.toNumber(x['Confirmed cases']);
           }
       });

        return output;
    }
    catch (err) {
        logger.info('Something went wrong fetching official Canadian Information for COVID19', {
            message: err.message || '',
            stack: err.stack || '',
        });
    }
};

module.exports = getOfficialCanadianData;
