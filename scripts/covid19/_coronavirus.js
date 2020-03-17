const logger = require('../../lib/logger');

const johnHopkinsAPI = require('./_johnHopkinsAPI');
const covid19HealthAPI = require('./_covid19HealthAPI');
const covid19Canada = require('./_getCanadaOfficialScraper');

const covid19CanadaResults = async () => {
    const errorMessage = 'Something went wrong trying to fetch the official Canadian numbers';

    try {
        return await covid19Canada();
    }
    catch (err) {
        logger.error(errorMessage, {
            message: err.message || '',
            stack: err.stack || ''
        });

        const error = new Error(errorMessage);
        error.innerErr = err;
        throw error;
    }
};

/**
 * Generate output
 * SARS-CoV-2 Global (Excluding Main Land China) - 5 hours ago → 30,628 Confirmed → 3,664 Cured → 772 Dead
 * @param region
 * @param city
 * @returns {Promise<boolean|{location: {province: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}>}
 */
const covid19Results = async (region, city) => {
    const errorMessage = 'Something went wrong getting information from John Hopkins';
    try {
        return await johnHopkinsAPI(region, city);
    } catch (err) {
        logger.error(errorMessage, {
            message: err.message || '',
            stack: err.stack || ''
        });

        const error = new Error(errorMessage);
        error.innerErr = err;
        throw error;
    }
};

/**
 * Gen
 * @param region
 * @param city
 * @returns {Promise<*>}
 */
const covid19StatsResults = async (region, city) => {
    try {
         return await covid19HealthAPI(region, city);
    } catch (err) {
        logger.error('Something went wrong getting information from Covid19.health', {
            message: err.message || '',
            stack: err.stack || ''
        });

        const error = new Error('Something went wrong getting information from Covid19Health.');
        error.innerErr = err;
        throw error;
    }
};

module.exports = {
    covid19Results: covid19Results,
    covid19StatsResults: covid19StatsResults,
    covidCanadaResults: covid19CanadaResults,
};
