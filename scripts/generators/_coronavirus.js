const rp = require('request-promise-native');
const endPoint = 'https://covid19.health/data/all.json';
const _ = require('lodash');

const getLastKey = obj => Object.getOwnPropertyNames(obj).slice(-1)[0];
const getSecondLastKey = obj => Object.getOwnPropertyNames(obj).slice(-2)[0];
const getLastValue = confirmed => confirmed[Object.keys(confirmed)[Object.keys(confirmed).length - 1]];
const getSecondLastValue = confirmed => confirmed[Object.keys(confirmed)[Object.keys(confirmed).length - 2]];

const produceResults = (data, region, province) => {
    if (!_.isObject(data) || _.isEmpty(data) || !_.isString(region) || _.isEmpty(region)) {
        return false;
    }

    const formattedRegion = formatRegion(region);

    const intermResults = _.filter(data, x => x.ENGLISH === formattedRegion)[0];

    if (!_.isObject(intermResults) || _.isEmpty(intermResults)) {
        return false;
    }

    // Prepare output object
    let output = {
        location: {
            region: formattedRegion,
            province,
        }
    };

    if (
        intermResults.hasOwnProperty('confirmedCount') &&
        _.isObject(intermResults.confirmedCount) &&
        !_.isEmpty(intermResults.confirmedCount)
    ) {
        const confirmed = intermResults.confirmedCount;
        output.confirmed = {
            current: {
                value: getLastValue(confirmed),
                date: getLastKey(confirmed)
            },
            previous: {
                value: getSecondLastValue(confirmed),
                date: getSecondLastKey(confirmed)
            },
        };
        // Append computed props
        output.confirmed.delta = output.confirmed.current.value - output.confirmed.previous.value;
    }

    // Cured Count
    if (
        intermResults.hasOwnProperty('curedCount') &&
        _.isObject(intermResults.curedCount) &&
        !_.isEmpty(intermResults.curedCount)
    ) {
        const cured = intermResults.curedCount;
        output.cured = {
            current: {
                value: getLastValue(cured),
                date: getLastKey(cured)
            },
            previous: {
                value: getSecondLastValue(cured),
                date: getSecondLastKey(cured)
            },
        };
        // Append computed props
        output.cured.delta = output.cured.current.value - output.cured.previous.value;
    }

    // Dead Count
    if (
        intermResults.hasOwnProperty('deadCount') &&
        _.isObject(intermResults.deadCount) &&
        !_.isEmpty(intermResults.deadCount)
    ) {
        const dead = intermResults.deadCount;
        output.dead = {
            current: {
                value: getLastValue(dead),
                date: getLastKey(dead)
            },
            previous: {
                value: getSecondLastValue(dead),
                date: getSecondLastKey(dead)
            },
        };
        // Append computed props
        output.dead.delta = output.dead.current.value - output.dead.previous.value;
    }

    return output;
};

const formatRegion = region => {
    const lower = _.toLower(region);
    switch (lower) {
        case 'usa':
        case 'united states':
        case 'america':
        case 'united states of america':
            return 'United States of America';
        default:
            return _.startCase(lower);
    }
};

module.exports = async (region, province) => {
    try {
        // Do not proceed with the Request
        if (!_.isString(region) || _.isEmpty(region)) {
            return false;
        }
        // Gather results
        const data = await rp({uri: endPoint, json: true});
        // Return Results Object
        return produceResults(data, region, province);
    } catch (err) {
        console.dir(err);
        const error = new Error('Something went wrong getting information https://covid19.health');
        error.innerErr = err;
        throw error;
    }
};
