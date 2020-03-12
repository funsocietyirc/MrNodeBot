const _ = require('lodash');
const scraper = require('table-scraper');
const logger = require('../../lib/logger');

// End Points
const endPoint = 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html';

const provinceTerritoryKey = 'Province, territory or other';
const confirmedCasesKey = 'Confirmed cases';

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
           if(x[provinceTerritoryKey] === 'Total cases:') {
               output.total = _.toNumber(x[confirmedCasesKey]);
           }
           else {
               output[_.toLower(x[provinceTerritoryKey])] = _.toNumber(x[confirmedCasesKey]);
           }
       });

        return output;
    }
    catch (err) {
        logger.error('Something went wrong fetching official Canadian Information for COVID19', {
            message: err.message || '',
            stack: err.stack || '',
        });
    }
};

module.exports = getOfficialCanadianData;
