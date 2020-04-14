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

/**
 * Helper to append Result
 * @param obj Object Results Object
 * @param output function Output Helper
 * @param label string Label
 * @param color string Display Color
 * @param diff? Object Diff Object
 */
const appendResult = (obj, output, label, color, diff) => {

    const currentValue = c[color](helpers.formatNumber(obj.current.value));
    const currentDiff = _.isObject(diff) ? '(' + c[color](helpers.formatNumber(obj.current.value - diff.current.value)) + ')' : '';
    output = output.append(`${currentValue}${currentDiff} ${label}`);
    if (obj.hasOwnProperty('delta')) {
        output =  output.append(c.blue(`${helpers.formatNumber(obj.delta)} +/-`));
    }
    return output;
};

module.exports = app => {

    /**
     * Covid19 Canada Data - Fed By Web Scraping official Canadian Government Information website
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const covid19CanadaHandler = async (to, from, text) => {
        try {
            const results = await corona.covid19CanadaResults(text);

            if (!results || !_.isObject(results) || _.isEmpty(results) || _.isEmpty(results.numbers)) {
                app.say(to, `There seems to be no Canadian information available, ${from}`);
                return;
            }

            // Output to IRC
            const outputOptions = {
                logo: 'coronavirus',
            };

            const output = new typo.StringBuilder(outputOptions);
            output.appendBold('Canada');

            // Flatten Data Provided
            if (results.flattenDataProvided) {
                output.appendBold(results.flattenData.lastAccessed.fromNow());
                _.each(results.flattenData.confirmedCases, v => _(v)
                    .filter(x => x.province === results.numbers[Object.keys(results.numbers)[0]].province)
                    .each(city => {
                        output.appendBold(`[${c.blue(city.city)}]`);
                        output.append(`${c.green(helpers.formatNumber(city.cases))} Confirmed`);
                    })
                );
            } else if (!results.flattenDataProvided && !_.isEmpty(results.flattenData.filterCity)) {
                output.append(`I have no results for ${results.flattenData.filterCity}, ${from}`);
            }

            output.appendBold(`${results.lastUpdate}`);

            _.forEach(results.numbers, (value, region) => {
                const formattedRegion = c.blue(_.startCase(region));
                const formattedConfirmed = ' ' + c.green(helpers.formatNumber(value.confirmed)) + ' Conf';
                const formattedToday = value.today > 0 ? ' (+' + c.yellow(helpers.formatNumber(value.today)) + ')' : '';
                const formattedPercentToday = value.percentToday !== '' ? ' (+' + c.yellow(value.percentToday) + ')' : '';
                const formattedProbable = value.probable > 0 ? ' ' + c.cyan(helpers.formatNumber(value.probable)) + ' Prob' : '';
                const formattedTotal = value.total !== value.confirmed ? ' ' + c.navy(helpers.formatNumber(value.total)) + ' Total' : '';
                const formattedTested = value.tested > 0 ? ' ' + c.teal(helpers.formatNumber(value.tested)) + ' Tested' : '';
                const formattedDead = value.dead > 0 ? ' ' + c.red(helpers.formatNumber(value.dead)) + ' Dead' : '';
                const formattedFatality = value.caseFatality ? ' (' + c.red(_.round(value.caseFatality, 3)) + '%)' : '';
                const formattedPercentPositive = value.percentPositive ? ' (' + c.teal(_.round(value.percentPositive, 3)) + '%)' : '';

                // Output to IRC
                output.insert(
                    `[${formattedRegion}]${formattedConfirmed}${formattedToday}${formattedPercentToday}${formattedProbable}${formattedTotal}${formattedTested}${formattedPercentPositive}${formattedDead}${formattedFatality}\n`
                );
            });

            if (to !== from) {
                app.say(to, `I have private messaged you the information you have requested, ${from}`);
            }

            app.say(from, output.text.replace(/\s\s+/g, ' '));
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
        call: covid19CanadaHandler,
    });

    /**
     * Covid 19 Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const covid19Handler = async(to, from, text) => {
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
            'Recovered',
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
                'Recovered',
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
        call: covid19Handler,
    });

    /**
     * Coronavirus command handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const covid19StatsHandler = async (to, from, text) => {
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
        if (result.has.recovered) appendResult(result.recovered, output, 'Recovered', 'green') ;
        if (result.has.dead)  appendResult(result.dead, output, 'Dead', 'red');

        // Say Output
        app.say(to, output.text);
    };
    app.Commands.set('covid19-stats', {
        desc: '[Region]?, [City]?  - COVID-19 Stats Compiled daily by https://covid19.health',
        access: app.Config.accessLevels.guest,
        call: covid19StatsHandler,
    });

    /**
     * Covid 19 Command, inspired by https://github.com/pwr22/covbot/blob/master/covbot.py
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const covidRiskHandler = async (to, from, text) => {
        try {
            const age = _.parseInt(text);
            if (!_.isNumber(age) || age > 110 || age < 0) {
                app.say(to, `I am sorry ${from}, the risk model only handles ages between 0 and 110 (inclusive)`);
                return;
            }

            const risk = corona.covid19Risk(age);

            // Output to IRC
            const output = new typo.StringBuilder({
                logo: 'coronavirus',
            });

            output
                .appendBold('Covid-19 Risks')
                .append(`Age: ${age}`)
                .append(`Survival: ${c.green(
                    _.round(risk.survivalRate * 100,4)
                )}%`)
                .append(`Hospitalization: ${c.blue(
                    _.round(risk.hRate * 100,4)
                )}%`)
                .append(`ICU: ${c.yellow(
                    _.round(risk.icRate * 100,4)
                )}%`)
                .append(`Death ${c.red(
                    _.round(risk.deathRate * 100, 4)
                )}%`);

            // Say Output
            app.say(to, output.text);
        }
        catch (err) {
            app.say(to, `Something went wrong processing your COVID19-Risk, ${from}`);
            logger.error('Something went wrong in the covid risk command', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    app.Commands.set('covid19-risk', {
        desc: '[age] - COVID-19 Risk by age based on computer model provided by https://www.desmos.com/calculator/v0zif7tflm',
        access: app.Config.accessLevels.guest,
        call: covidRiskHandler,
    });

    // Return the script info
    return scriptInfo;
};
