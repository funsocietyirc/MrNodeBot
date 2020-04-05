const _ = require('lodash');
const moment = require('moment');
const rp = require('request-promise-native');

const logger = require('../../lib/logger');
const provinces = require('./_formatCanadianProvinces');
const flattenData = require('./_flattenCanadaData');

// End Points
const csvEndPoint = 'https://health-infobase.canada.ca/src/data/covidLive/covid19.csv';

// Request the current minutes to midnight feed.
const _request = async () => {
    try {
        return await rp({uri: csvEndPoint});
    } catch (err) {
        throw new Error('Unexpected Status Code');
    }
};

/**
 * Format / Parse numbers
 * @param number
 * @returns {number}
 */
const formatNumbers = number => _.toNumber(number);

/**
 * Extract Canadian CSV Results into Normalized Object format
 * @param data
 * @param province
 * @returns {Promise<{date: (*|moment.Moment), total: number, locationFR: *, today: number, probable: number, location: Location | WorkerLocation, dead: number, id: *, confirmed: number}[]>}
 * @private
 */
const _extractCsv = async (data, province = false) => {
    // No / Invalid data
    if (_.isNil(data) || !_.isString(data)) {
        throw new Error('Invalid return data from Canadian CSV Source');
    }

    // Split Rows
    const rows = data.split('\r\n');

    // No records
    if (_.isNil(data) || !_.isString(data)) {
        throw new Error('No Data in Canadian CSV Source');
    }
    // Build Results Object
    return _(rows).drop(1).map(x => {
        // pruid,prname,prnameFR,date,numconf,numprob,numdeaths,numtotal,numtoday
        // pruid,prname,prnameFR,date,numconf,numprob,numdeaths,numtotal,numtested,numtoday,percentoday
        [id, location, locationFR, sdate, confirmed, probable, deaths, total, tested, today, percentToday] = x.split(',');
        if (province && _.isString(location) && location.toLowerCase() !== province) return;
        const out =  {
            id, location, locationFR,
            date: moment(sdate, 'DD-MM-YYYY'),
            confirmed: _.parseInt(confirmed),
            probable: _.parseInt(probable),
            tested: _.parseInt(tested),
            percentToday: percentToday,
            dead: _.parseInt(deaths),
            total: _.parseInt(total),
            today: _.parseInt(today),
        };
        out.caseFatality = (out.dead / out.total) * 100;
        out.percentPositive = out.total && out.tested ? (out.total / out.tested) * 100 : 0;
        return out;
    }).reject(x => _.isNull(x) || _.isUndefined(x));
};

/**
 * Extract One days Data
 * @param csvResults
 * @param flattenResults
 * @returns {Promise<{numbers: {}}>}
 * @private
 */

const _todaysData = async (csvResults, flattenResults) => {
    if (!csvResults) {
        throw new Error('There are no csvResults provided from the Canadian CSV Parser')
    }

    // Output Object
    const output = {
        numbers: {}
    };

    // Filter On Todays date when available, or yesterdays when now,
    const filtered = csvResults.filter(x => x.date.format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')).value();
    const finalFiltered = !_.isEmpty(filtered) ? filtered : csvResults.filter(x => x.date.format('DD-MM-YYYY') === moment().subtract(1, 'days').format('DD-MM-YYYY')).value();

    // Build csvResults Object
    for (let x of finalFiltered) {
        output.numbers[provinces.formatCanadianProvinces(x.location)] = {
            confirmed: formatNumbers(x.confirmed),
            probable: formatNumbers(x.probable),
            dead: formatNumbers(x.dead),
            today: formatNumbers(x.today),
            total: formatNumbers(x.total),
            tested: formatNumbers(x.tested),
            percentToday: x.percentToday,
            percentPositive: x.percentPositive,
            date: x.date,
            caseFatality: x.caseFatality,
        };
    }
    output.lastUpdate = !_.isEmpty(Object.keys(output.numbers)) ?  output.numbers[Object.keys(output.numbers)[0]].date.fromNow() : 'No Date';

    // No Flatten Results provided, short circuit
    if (
        !_.isObject(flattenResults) ||
        !flattenResults.hasOwnProperty('confirmedCases') ||
        !_.isObject(flattenResults.confirmedCases) ||
        _.isEmpty(flattenResults.confirmedCases) ||
        !flattenResults.hasOwnProperty('lastUpdated')
    ) {
        output.flattenDataProvided = false;
        return output;
    }

    // Associate Flatten Data
    output.flattenDataProvided = true;
    output.flattenData = flattenResults;

    return output;
};

/**
 * Parser
 * @returns {Promise<{numbers: {}}>}
 */
const newVersionCSV = async (province = '', city = '') => {
    try {
        const normalizedProvince = provinces.normalizeProvince(province);
        const requested = await _request();
        const csvResults = await _extractCsv(requested, normalizedProvince);
        const flattenResults = _.isEmpty(city) ? null : await flattenData(city);
        return await _todaysData(csvResults, flattenResults);
    } catch (err) {
        logger.error('Error in the _getCanadaOfficialScraper Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = newVersionCSV;
