const scriptInfo = {
    name: 'CoronaVirus',
    desc: 'CoronaVirus stats',
    createdBy: 'IronY',
};

const corona = require('./_coronavirus');
const _ = require('lodash');
const typo = require('../lib/_ircTypography');
const helpers = require('../../helpers');
const c = require('irc-colors');
const logger = require('../../lib/logger');

const chunkObj = (input, size) =>  _.chain(input).toPairs().chunk(size).map(_.fromPairs).value();
/**
 * Helper to append Result
 * @param obj Object Results Object
 * @param output function Output Helper
 * @param label string Label
 * @param color string Display Color
 * @param diff? Object Diff Object
 */
const appendResult = (obj, output, label, color, diff) => {
    output = output
        .append(
    `${c[color](helpers.formatNumber(obj.current.value))}${_.isObject(diff) ? '(' + c[color](helpers.formatNumber(obj.current.value - diff.current.value)) + ')' : ''} ${label}`
        );
    if (obj.hasOwnProperty('delta')) {
        output =  output.append(c.blue(`${helpers.formatNumber(obj.delta)} +/-`));
    }
    return output;
};

module.exports = (app) => {
    /**
     * Covid19 Canada Data - Fed By Web Scraping official Canadian Government Information website
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const covid19Canada = async (to, from, text, message) => {
        try {
            const results = await corona.covidCanadaResults();

            if(!results || !_.isObject(results) || _.isEmpty(results) || _.isEmpty(results.numbers)) {
                app.say(to, `There seems to be no Canadian information available, ${from}`);
                return;
            }

            // Output to IRC
            const outputOptions = {
                logo: 'coronavirus',
            };

            const resultsChunked = chunkObj(results.numbers, Object.keys(results.numbers).length / 4);
            let first = true;
            _.forEach(resultsChunked, chunk => {
                const output = new typo.StringBuilder(first ? outputOptions : {});
                output.appendBold(first ? `Canada - ${results.lastUpdate}` : '');
                first = first ? !first : first;
                _.forEach(chunk, (value, region) => {
                    const formattedRegion = c.blue(_.startCase(region));
                    const formattedConfirmed = ' ' + c.green(helpers.formatNumber(value.confirmed)) + ' Conf';
                    const formattedToday = value.today > 0 ? ' (+' + c.yellow(helpers.formatNumber(value.today)) + ')' : '';
                    const formattedProbable = value.probable > 0 ? ' ' + c.cyan(helpers.formatNumber(value.probable)) + ' Prob' : '';
                    const formattedTotal = value.total !== value.confirmed ? ' ' + c.navy(helpers.formatNumber(value.total)) + ' Total' : '';
                    const formattedDead = value.dead > 0 ? ' ' + c.red(helpers.formatNumber(value.dead)) + ' Dead' : '';
                    const formattedFatality = value.caseFatality ? ' (' + c.red(_.round(value.caseFatality,2)) + '%)' : '';

                    output.insert(`[${formattedRegion}]${formattedConfirmed}${formattedToday}${formattedProbable}${formattedTotal}${formattedDead}${formattedFatality}`);
                });
                app.say(to, output.text.replace(/\s\s+/g, ' '));
            });

        }
        catch (err) {
            logger.error('Something went wrong with the Canadian Information', {
                message: err.message || '',
                stack: err.stack || '',
                to, from
            });
            app.say(to, `Something went wrong fetching the Canadian information, ${from}`);
        }
    };
    app.Commands.set('covid19-canada', {
        desc: 'COVID-19 Numbers Provided By Canadian Government',
        access: app.Config.accessLevels.guest,
        call: covid19Canada,
    });

    const covid19 = async(to, from, text, message) => {
        // Split on comma
        const [region, city] = text.split(',');

        // Get Results
        const result = await corona.covid19Results(region, city);
        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I have no confirmed results for ${region}${city ? ', ' + city : '' }, ${from}`);
            return;
        }

        /**
         * Stats Helper
         * @param obj Object Results object
         * @param diff? Object Diff Results object
         */
        const appendStats = (obj,diff) => {
            output.appendBold(`Mortality: ${c.red(obj.mortalityRate)}`);
            output.appendBold(`Recovery: ${c.green(obj.recoveryRate)}`);

            output
                .appendBold(
                    `Active: ${c.blue(helpers.formatNumber(obj.activeRate))}${_.isObject(diff) ? '(' + c.blue(helpers.formatNumber(obj.activeRate - diff.activeRate)) + ')' : ''}`
                );
        };

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region ? result.location.region : 'Global Without Mainland China'} ${c.lightgreen(result.lastDate)}`);

        // Append Confirmed
        appendResult(
            result.confirmed,
            output,
            'Confirmed',
            'yellow'
        );
        // Append Cured
        appendResult(result.cured,
            output,
            'Cured',
            'green') ;
        // Append Dead
        appendResult(result.dead,
            output,
            'Dead',
            'red'
        );
        // Append stats
        appendStats(result.stats);

        if(result.hasOwnProperty('actual')) {
            output.appendBold(c.lightgreen(`With China`));
            // Append Confirmed
            appendResult(
                result.actual.confirmed,
                output,
                'Confirmed',
                'yellow',
                result.confirmed,
            );
            // Append Cured
            appendResult(
                result.actual.cured,
                output,
                'Cured',
                'green',
                result.cured,
            );
            // Append Dead
            appendResult(
                result.actual.dead,
                output,
                'Dead',
                'red',
                result.dead
            );
            // Append Stats
            appendStats(result.actual.stats, result.stats);
        }

        // Say Output
        app.say(to, output.text);
    };

    app.Commands.set('covid19', {
        desc: '[Region]?, [City/Province]? - COVID-19 Facts Provided By John Hopkins',
        access: app.Config.accessLevels.guest,
        call: covid19,
    });

    /**
     * Coronavirus command handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const covid19Stats = async (to, from, text, message) => {
        // Split on comma
        const [region, province] = text.split(',');

        // Get Results
        const result = await corona.covid19StatsResults(region, province);

        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I got nothing, ${from}`);
            return;
        }

        // No Data
        if (
            !result.has.cured && !result.has.dead && !result.has.confirmed
        ) {
            app.say(to, `I have no Coronavirus information for ${result.location.region} ${result.location.province ? result.location.province : ''}, ${from}`);
            return;
        }

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region} - ${result.lastDate}`);

        if (result.has.confirmed) appendResult(result.confirmed, output, 'Confirmed', 'yellow');
        if (result.has.cured) appendResult(result.cured, output, 'Cured', 'green') ;
        if (result.has.dead)  appendResult(result.dead, output, 'Dead', 'red');

        // Say Output
        app.say(to, output.text);
    };

    /**
     * Export Command
     */
    app.Commands.set('covid19-stats', {
        desc: '[Region]?, [City]?  - COVID-19 Stats Compiled daily by https://covid19.health',
        access: app.Config.accessLevels.guest,
        call: covid19Stats,
    });

    /**
     * Covid 19 Command, inspired by https://github.com/pwr22/covbot/blob/master/covbot.py
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const covidRisk = async (to, from, text, message) => {
        try {
            const age = _.parseInt(text);
            if (!_.isNumber(age) || age > 110 || age < 0) {
                app.say(to, `I am sorry ${from}, the risk model only handles ages between 0 and 110 (inclusive)`);
                return;
            }

            const deathRate = Math.max(0, -0.00186807 + 0.00000351867 * age ** 2 + (2.7595 * 10 ** -15) * age ** 7);
            const icRate = Math.max(0, -0.0572602 - -0.0027617 * age);
            const hRate = Math.max(0, -0.0730827 - age * -0.00628289);
            const survivalRate = 1 - deathRate;

            // Output to IRC
            const output = new typo.StringBuilder({
                logo: 'coronavirus',
            });

            output
                .appendBold('Covid-19 Risks')
                .append(`Age: ${age}`)
                .append(`Survival: ${c.green(
                    _.round(survivalRate * 100,4)
                )}%`)
                .append(`Hospitalization: ${c.blue(
                    _.round(hRate * 100,4)
                )}%`)
                .append(`ICU: ${c.yellow(
                    _.round(icRate * 100,4)
                )}%`)
                .append(`Death ${c.red(
                    _.round(deathRate * 100, 4)
                )}%`);

            // Say Output
            app.say(to, output.text);
        }
        catch (err) {
            logger.error('Something went wrong in the covid risk command', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    app.Commands.set('covid19-risk', {
        desc: '[age] - COVID-19 Risk by age based on computer model provided by https://www.desmos.com/calculator/v0zif7tflm',
        access: app.Config.accessLevels.guest,
        call: covidRisk,
    });
    // Return the script info
    return scriptInfo;
};
