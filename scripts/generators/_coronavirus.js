const rp = require('request-promise-native');
const endPoint = 'https://covid19.health/data/all.json';
const _ = require('lodash');

/**
 * Get Key From Object
 * @param obj
 * @param index
 * @returns {string}
 */
const getKeyFromObj = (obj, index) => Object.getOwnPropertyNames(obj).slice(index)[0];

/**
 * Get Value From Object
 * @param obj
 * @param index
 * @returns {*}
 */
const getValueFromObj = (obj, index) => obj[Object.keys(obj)[Object.keys(obj).length + index]];

/**
 * Normalize and Format Region
 * @param region
 * @returns {string}
 */
const formatRegion = region => {
    const lower = _.toLower(region);
    switch (lower) {
        case null:
        case '':
        case 'world':
        case 'global':
        case 'earth':
            return 'Global';
        case 'usa':
        case 'united states':
        case 'america':
        case 'united states of america':
            return 'United States of America';
        case 'uk':
        case 'united kingdom':
        case 'britain':
            return 'United Kingdom';
        default:
            return _.startCase(lower);
    }
};

/**
 * Append Stat Object (Mutating)
 * @param intermResults
 * @param output
 * @param prop
 * @param key
 */
const appendStat = (intermResults, output, prop, key) => {
    if (
        intermResults.hasOwnProperty(prop) &&
        _.isObject(intermResults[prop]) &&
        !_.isEmpty(intermResults[prop])
    ) {
        const innerData = intermResults[prop];
        output[key] = {
            current: {
                value: getValueFromObj(innerData, -1),
                date: getKeyFromObj(innerData, -1)
            },
            previous: {
                value: getValueFromObj(innerData, -2),
                date: getKeyFromObj(innerData, -2)
            },
        };
        // Append computed props
        output[key].delta = output[key].current.value - output[key].previous.value;
    }
};

/**
 * Produce Output results
 * @param data
 * @param region
 * @param province
 * @returns {{location: {province: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}|boolean}
 */
const produceResults = async (region, province) => {
    // Gather results
    const data = await rp({uri: endPoint, json: true});

    // Pre Flight Check
    if (!_.isObject(data) || _.isEmpty(data)) {
        return false;
    }

    // Normalize Region Name
    const formattedRegion = formatRegion(region);

    // Normalize Down to Region
    const intermResults = _.filter(data, x => x.ENGLISH === formattedRegion)[0];

    // Post Flight Check
    if (!_.isObject(intermResults) || _.isEmpty(intermResults)) {
        return false;
    }

    // Hold on to the potential result factors
    const hasCured = intermResults.hasOwnProperty('curedCount');
    const hasDead = intermResults.hasOwnProperty('deadCount');
    const hasConfirmed = intermResults.hasOwnProperty('confirmedCount');

    // Prepare output object
    let output = {
        location: {
            region: formattedRegion,
            province,
        },
        has: {
            cured: hasCured,
            confirmed: hasConfirmed,
            dead: hasDead,
        },
    };

    // Append Stats
    appendStat(intermResults, output, 'confirmedCount', 'confirmed');
    appendStat(intermResults, output, 'curedCount', 'cured');
    appendStat(intermResults, output, 'deadCount', 'dead');

    // Append last Date
    output.lastDate =
        hasConfirmed ? output.confirmed.current.date : (
            hasCured ? output.cured.current.date : (
                hasDead ? output.dead.current.date : 'No Date Available'
            )
        );

    return output;
};

/**
 * Generate output
 * @param region
 * @param province
 * @returns {Promise<boolean|{location: {province: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}>}
 */
const gen = async (region, province) => {
    try {
        // Return Results Object
        return await produceResults(region, province);
    } catch (err) {
        const error = new Error('Something went wrong getting information.');
        error.innerErr = err;
        throw error;
    }
};

module.exports = gen;
