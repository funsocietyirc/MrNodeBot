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
 *
 * @param city
 * @returns {string}
 */
const formatCity = city => _.startCase(_.toLower(city));

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
        case 'us':
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
 * @param city
 * @returns {{location: {city: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}|boolean}
 */
const produceResults = async (region, city) => {
    // Gather results
    const data = await rp({uri: endPoint, json: true});

    // Pre Flight Check
    if (!_.isObject(data) || _.isEmpty(data)) {
        return false;
    }

    // Normalize Region Name
    const formattedRegion = formatRegion(region);

    // Normalize Down to Region
    let intermResults = _(data).filter(x => x.ENGLISH === formattedRegion);

    // Province provided
    if (_.isString(city) && !_.isEmpty(city)) {
        console.dir('HIT');
        const formattedCity = formatCity(city);
        intermResults = _
            .filter(
                intermResults.omit(['confirmedCount', 'deadCount', 'curedCount']).value()[0],
                x => x.hasOwnProperty('ENGLISH') && x.ENGLISH.split(',')[0].startsWith(formattedCity)
            );
    }

    // Hold on to final results
    const finalResults = _.isFunction(intermResults.value) ?  intermResults.value()[0] : intermResults[0];

    // Post Flight Check
    if (!_.isObject(finalResults) || _.isEmpty(finalResults)) {
        return false;
    }

    // Hold on to the potential result factors
    const hasCured = finalResults.hasOwnProperty('curedCount');
    const hasDead = finalResults.hasOwnProperty('deadCount');
    const hasConfirmed = finalResults.hasOwnProperty('confirmedCount');

    // Prepare output object
    let output = {
        location: {
            region: formattedRegion,
            city,
        },
        has: {
            cured: hasCured,
            confirmed: hasConfirmed,
            dead: hasDead,
        },
    };

    // Append Stats
    appendStat(finalResults, output, 'confirmedCount', 'confirmed');
    appendStat(finalResults, output, 'curedCount', 'cured');
    appendStat(finalResults, output, 'deadCount', 'dead');

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
        console.dir(err);
        const error = new Error('Something went wrong getting information.');
        error.innerErr = err;
        throw error;
    }
};

module.exports = gen;
