const _ = require('lodash');
const logger = require('../../lib/logger');
const moment = require('moment');
const rp = require('request-promise-native');

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
 * Format Names
 * @param name
 * @returns {string}
 */
const formatNames = (name) => {
    switch (name) {
        case 'British Columbia':
            return 'BC';
        case 'Alberta':
            return 'AB';
        case 'Saskatchewan':
            return 'SK';
        case 'Manitoba':
            return 'MB';
        case 'Ontario':
            return 'ON';
        case 'New Brunswick':
            return 'NB';
        case 'Nova Scotia':
            return 'NS';
        case 'Prince Edward Island':
            return 'PEI';
        case 'Newfoundland and Labrador':
            return 'NL';
        case 'Yukon':
            return 'YK';
        case 'Northwest Territories':
            return 'NT';
        case 'Nunavut':
            return 'NU';
        case 'Repatriated travellers':
            return 'Repatriated';
        case 'Quebec':
            return 'QC';
        case 'Canada':
            return 'total';
        default:
            return name;
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
 * @returns {Promise<{date: (*|moment.Moment), total: number, locationFR: *, today: number, probable: number, location: Location | WorkerLocation, dead: number, id: *, confirmed: number}[]>}
 * @private
 */
const _extractCsv = async (data) => {
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
        [id, location, locationFR, sdate, confirmed, probable, deaths, total, today] = x.split(',');
        const out =  {
            id, location, locationFR,
            date: moment(sdate, 'DD-MM-YYYY'),
            confirmed: _.parseInt(confirmed),
            probable: _.parseInt(probable),
            dead: _.parseInt(deaths),
            total: _.parseInt(total),
            today: _.parseInt(today),
        };

        out.caseFatality = (out.dead / out.total) * 100;
        return out;
    });
};

const _todaysData = async (results) => {
    if (!results) {
        throw new Error('There are no results provided from the Canadian CSV Parser')
    }
    // Output Object
    const output = {
        numbers: {
            total: {}
        }
    };

    // Filter On Todays date when available, or yesterdays when now,
    const filtered = results.filter(x => x.date.format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')).value();
    const finalFiltered = !_.isEmpty(filtered) ? filtered : results.filter(x => x.date.format('DD-MM-YYYY') === moment().subtract(1, 'days').format('DD-MM-YYYY')).value();

    // Build results Object
    for (let x of finalFiltered) {
        output.numbers[formatNames(x.location)] = {
            confirmed: formatNumbers(x.confirmed),
            probable: formatNumbers(x.probable),
            dead: formatNumbers(x.dead),
            today: formatNumbers(x.today),
            total: formatNumbers(x.total),
            date: x.date,
            caseFatality: x.caseFatality,
        };
    }

    output.lastUpdate = output.numbers.total.date.fromNow();

    return output;
};

const newVersionCSV = async () => {
    try {
        const requested = await _request();
        const results = await _extractCsv(requested);
        return await _todaysData(results);
    } catch (err) {
        logger.error('Error in the _getCanadaOfficialScraper Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = newVersionCSV;
