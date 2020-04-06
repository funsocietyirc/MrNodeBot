const _ = require('lodash');
const rp = require('request-promise-native');
const moment = require('moment');
const logger = require('../../lib/logger');
const provinces = require('./_formatCanadianProvinces');

const endPoint = 'https://firebasestorage.googleapis.com/v0/b/flatten-271620.appspot.com/o/confirmed_data.json?alt=media';

// Request the current minutes to midnight feed.
const _request = async () => {
    try {
        return await rp({uri: endPoint, json: true});
    } catch (err) {
        throw new Error('Something went wrong fetching flattenCanada API');
    }
};

/**
 *
 * @param data
 * @param filterCity
 * @private
 */
const _extract = (data, filterCity) => {
    // Prepare output object
    const [lastAccessedString, lastUpdatedString] = data.last_updated.split('.').map(x => x.trim());

    const output = {
        lastUpdated: moment(lastUpdatedString.replace('Data last accessed at: ', ''), 'DD-MM-YYYY'),
        lastAccessed: moment(lastAccessedString.replace('Data last accessed at: ', ''), 'DD-MM-YYYY kk:mm'),
        maxCases: data.max_cases,
        confirmedCases: {},
        filterCity,
    };

    if (!filterCity) {
        return output;
    }

    // Normalize via Province Name
    _.each(data.confirmed_cases, confirmedCase => {
        const [city, province] = confirmedCase.name.trim().split(', ');
        const formattedProvince = provinces.formatCanadianProvinces(province);

        const location = _.isUndefined(formattedProvince) ? provinces.formatCanadianProvinces(city) : formattedProvince;

        if (!_.isEmpty(filterCity) && _.isString(city) && !_.includes(city.toLowerCase(),filterCity)) return;

        if (!output.confirmedCases.hasOwnProperty(location)) {
            output.confirmedCases[location] = [];
        }

        output.confirmedCases[location].push({
            city: city,
            province: location,
            cases: confirmedCase.cases,
            coords: confirmedCase.coords,
        });

        // Cleanup
        output.confirmedCases[location] = _(output.confirmedCases[location]).reject(x => _.isNull(x) || _.isUndefined(x)).value();
    });

    return output;
};

/**
 * Parser
 * @returns {Promise<{numbers: {}}>}
 */
const flattenCanadaData = async (input = '') => {
    try {
        const normalizedCity = _.isString(input) ? input.toLowerCase().trim() : '';
        const requested = await _request();
        return await _extract(requested, normalizedCity);
    } catch (err) {
        logger.error('Error in the _getCanadaOfficialScraper Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = flattenCanadaData;
