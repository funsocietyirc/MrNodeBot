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
    statesList: '/html/body/main/div[3]/ul[2]',
};

// Request the current minutes to midnight feed.
const _request = async () => {
    try {
        return await rp({uri: endPoint});
    } catch (err) {
        throw new Error('Unexpected Status Code');
    }
};

const _extract = async (data) => {
    try {

        const $ = cheerio.load(data);
        const output = {
            numbers: {
            }
        };

        // Build Result Numbers
        $(xpaths.resultsTable).each(function (x, y) {
            const [location, confirmed, probable, dead] = $(y).text().trim().split('\n');

            if (location === totalCasesKey) {
                output.numbers.total = { confirmed: _.toNumber(confirmed.replace(',','')) };
            } if (location !== totalCasesKey) {
                output.numbers[_.toLower(location.replace(',',''))] = {
                    confirmed: _.toNumber(confirmed.replace(',','')),
                    probable: _.toNumber(probable.replace(',','')),
                    dead: _.toNumber(dead.replace(',','')),
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
        console.dir(err);
        throw new Error('No result found');
    }

};

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
