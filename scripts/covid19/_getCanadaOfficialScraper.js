const _ = require('lodash');
const logger = require('../../lib/logger');
const moment = require('moment');
const cheerio = require('cheerio');
const rp = require('request-promise-native');

// End Points
const endPoint = 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html';

const totalCasesKey = "Total";

const xpaths = {
    resultsTable: 'body > main > div:nth-child(4) > table > tbody > tr',
    updatedAtString: 'body > main > div:nth-child(4) > table > caption',
};

// Request the current minutes to midnight feed.
const _request = async () => {
    try {
        return await rp({uri: endPoint});
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
        default:
            return 'N/A';
    }
};

/**
 * Format / Parse numbers
 * @param number
 * @returns {number}
 */
const formatNumbers = number => _.toNumber(number.replace(',', ''));

/**
 * Extract Data from HTML
 * @param data
 * @returns {Promise<{numbers: {}}>}
 * @private
 */
const _extract = async (data) => {
    try {

        const $ = cheerio.load(data);
        const output = {
            numbers: {}
        };

        // Build Result Numbers
        $(xpaths.resultsTable).each(function (x, y) {
            const [location, confirmed, probable, dead] = $(y).text().trim().split('\n');

            if (location === totalCasesKey) {
                output.numbers.total = {confirmed: formatNumbers(confirmed)};
            } if (location !== totalCasesKey) {
                output.numbers[formatNames(location)] = {
                    confirmed: formatNumbers(confirmed),
                    probable: formatNumbers(probable),
                    dead: formatNumbers(dead),
                };
            }
        });

        // Append Total
        output.numbers.total.probable = _.sum(_.map(output.numbers, 'probable'));
        output.numbers.total.dead = _.sum(_.map(output.numbers, 'dead'));

        // Parse / Append Dates
        // 'March 18, 2020, 5:20 pm EDT'
        const updatedAt = moment(
            $(xpaths.updatedAtString).text().replace('Areas in Canada with cases of COVID-19 as of ','').trim().replace(/\s\s+/g, ' '),
            "MMMM DD, YYYY, HH:mm A zz"
        );
        output.lastUpdate = updatedAt.fromNow();
        output.lastUpdateRaw = updatedAt.toDate();

        return output;
    } catch (err) {
        throw new Error('No result found');
    }
};

/**
 * Get Data from server
 * @returns {Promise<{numbers: {}}>}
 */
const newVersion = async () => {
    try {
        const requested = await _request();
        return await _extract(requested);
    } catch (err) {
        logger.error('Error in the _getCanadaOfficialScraper Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = newVersion;
