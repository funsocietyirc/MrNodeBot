const scriptInfo = {
    name: 'CoronaVirus',
    desc: 'CoronaVirus stats',
    createdBy: 'IronY',
};

const corona = require('../generators/_coronavirus');
const _ = require('lodash');
const typo = require('../lib/_ircTypography');
const helpers = require('../../helpers');
const c = require('irc-colors');

/**
 * Helper to append Result
 * @param obj Object Results Object
 * @param label string Label
 * @param color string Display Color
 */
const appendResult = (obj, output, label, color) => {
    output = output.append(c[color](`${helpers.formatNumber(obj.current.value)} ${label}`));
    if (obj.hasOwnProperty('delta')) {
        output =  output.append(c.blue(`${helpers.formatNumber(obj.delta)} +/-`));
    }
    return output;
};

module.exports = (app) => {
    const coronavirusRT = async(to, from, text, message) => {
        // Split on comma
        const [region, city] = text.split(',');
        // Get Results
        const result = await corona.genRealtime(region, city);
        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I have no confirmed results for ${region}${city ? ', ' + city : '' }, ${from}`);
            return;
        }

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region} - ${result.lastDate}`);

        appendResult(result.confirmed, output, 'Confirmed', 'yellow');
        appendResult(result.cured, output, 'Cured', 'green') ;
        appendResult(result.dead, output, 'Dead', 'red');

        // Say Output
        app.say(to, output.text);
    };

    /**
     * Coronavirus command handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const coronavirus = async (to, from, text, message) => {
        // Split on comma
        const [region, province] = text.split(',');
        // Get Results
        const result = await corona.gen(region, province);
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
    app.Commands.set('coronavirus', {
        desc: '[Region] [Province?] Coronavirus stats (Compiled Daily)',
        access: app.Config.accessLevels.identified,
        call: coronavirus,
    });

    app.Commands.set('coronavirus-rt', {
        desc: '[Region] [Province?] Coronavirus stats (Real Time)',
        access: app.Config.accessLevels.identified,
        call: coronavirusRT,
    });
    // Return the script info
    return scriptInfo;
};
