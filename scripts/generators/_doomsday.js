// API Endpoint
const endPoint = 'https://thebulletin.org/doomsday-clock/current-time/';

// Node Modules
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const cheerio = require('cheerio');

// Date of Midnight
const midnight = new Date(2000, 0, 0, 0, 0, 0, 0);

// Format a time string
const toTime = minutes => new Date(midnight.getTime() + minutes * -60000);

// Format date to string
const dateToString = d => `${pad(2, d.getHours() - 12)}:${pad(2, d.getMinutes())}${d.getSeconds() ? `:${pad(2, d.getSeconds())}` : ''} PM`;

// Pad with 0's
const pad = (min, input) => {
    let out = `${input}`;
    while (out.length < min) { out = `0${out}`; }
    return out;
};

// General Configuration
const conf = {
    selector: '#full-statement > div > h3 > span',
    title: /(?:(\d+)|(one|two|three|four|five|six|seven|eight|nine)(.*?half)) seconds to midnight/i,
};

// Numbers to english string
const numberStringToInt = (value) => {
    switch (value.toLowerCase()) {
    case 'one':
        return 1;
    case 'two':
        return 2;
    case 'three':
        return 3;
    case 'four':
        return 4;
    case 'five':
        return 5;
    case 'six':
        return 6;
    case 'seven':
        return 7;
    case 'eight':
        return 8;
    case 'nine':
        return 9;
    }
    return NaN;
};

// Request the current minutes to midnight feed.
const _request = async () => {
    try {
        return await rp({ uri: endPoint, json: true });
    } catch (err) {
        throw new Error('Unexpected Status Code');
    }
};

// Extract the relevant data
const _extract = (data) => {
    const $ = cheerio.load(data);

    const nodes = $(conf.selector)
        .map(function () {
            return $(this).text();
        })
        .get();

    for (const node of nodes) {
        const result = node.match(conf.title);
        if (result) {
            if (!isNaN(result[1])) { return parseInt(result[1]); }
            if (result[2]) {
                const whole = numberStringToInt(result[2]);
                if (!isNaN(whole)) return whole + 0.5;
            }
        }
    }

    throw new Error('No result found');
};

// Export the chain
module.exports = async () => {
    try {
        const requested = await _request();
        const extracted = await _extract(requested);
        return dateToString(toTime(extracted / 60));
    } catch (err) {
        logger.error('Error in the _doomsday Generator', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};
