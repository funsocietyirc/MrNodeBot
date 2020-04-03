const rp = require('request-promise-native');

const formatCanadianProvinces = require('./_formatCanadianProvinces');

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
 * @private
 */
const _extract = data => {
    // Prepare output object
    const [lastAccessedString, lastUpdatedString] = data.last_updated.split('.').map(x => x.trim());

    const output = {
        lastUpdated: moment(lastUpdatedString, 'Latest case reported on: 29-03-2020'),
        lastAccessed: moment(lastAccessedString, 'Data last accessed at: 30/03/2020 00:07'),
        maxCases: data.max_cases,
        confirmedCases: {},
    };

    // Normalize via Province Name
    _.each(data.confirmed_cases, confirmedCase, confirmedCase => {
        const [city, province] = confirmedCase.name.trim().split(',');
        output.confirmedCases[formatCanadianProvinces(province)] = {
            name: city,
            cases: confirmedCase.cases,
            coords: confirmedCase.coords,
        }
    });

    return output;
};
