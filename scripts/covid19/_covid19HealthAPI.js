const rp = require('request-promise-native');
const _ = require('lodash');
const helpers = require('../../helpers');

const covid19HealthEndPoint = 'https://covid19.health/data/all.json';

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
                value: helpers.getValueFromObj(innerData, -1),
                date: helpers.getKeyFromObj(innerData, -1)
            },
            previous: {
                value: helpers.getValueFromObj(innerData, -2),
                date: helpers.getKeyFromObj(innerData, -2)
            },
        };
        // Append computed props
        output[key].delta = output[key].current.value - output[key].previous.value;
    }
};

/**
 * @param city
 * @returns {string}
 */
const formatCity = city => _.trim(_.startCase(_.toLower(city)));

/**
 * Normalize and Format Region
 * @param region
 * @returns {string}
 */
const formatRegion = region => {
    const lower = _.trim(_.toLower(region));
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
 * Produce Output results
 * @param region
 * @param city
 * @returns {{location: {city: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}|boolean}
 */
const covid19HealthResults = async (region, city) => {

    // Gather results
    const data = await rp({uri: covid19HealthEndPoint, json: true});

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
        const formattedCity = formatCity(city);
        intermResults = _
            .filter(
                intermResults.omit(['confirmedCount', 'deadCount', 'curedCount']).value()[0],
                x => x.hasOwnProperty('ENGLISH') && x.ENGLISH.split(',')[0] === formattedCity
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

module.exports = covid19HealthResults;
