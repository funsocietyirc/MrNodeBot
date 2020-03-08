const scriptInfo = {
    name: 'CoronaVirus',
    desc: 'CoronaVirus stats',
    createdBy: 'IronY',
};

const gen = require('../generators/_coronavirus');
const _ = require('lodash');
const typo = require('../lib/_ircTypography');
const helpers = require('../../helpers');
const c = require('irc-colors');

module.exports = (app) => {
    const coronavirus = async (to, from, text, message) => {

        if (!text) {
            app.say(to, `I need a Country to get that data for you, ${from}`);
            return;
        }

        // Get Results
        const result = await gen(text);

        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I got nothing, ${from}`);
            return;
        }

        const hasCured = result.hasOwnProperty('cured');
        const hasDead = result.hasOwnProperty('dead');
        const hasConfirmed = result.hasOwnProperty('confirmed');

        // No Data
        if (
            !hasCured && !hasDead && !hasConfirmed
        ) {
            app.say(to, `I got nothing, ${from}`);
            return;
        }

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Helper function for output
        const appendResult = (x, y, z) => output
            .append(c[z](`${helpers.formatNumber(x.current.value)} ${y}`))
            .append(c.blue(`${x.delta} +/-`));

        // Normalize Date
        const date =
            hasConfirmed ? result.confirmed.current.date : (
                hasCured ? result.cured.current.date : (
                    hasDead ? result.dead.current.date : 'No Date Available'
                )
            );

        // Create Output
        output.appendBold(`${result.location.region} - ${date}`);
        if (hasConfirmed) appendResult(result.confirmed, 'Confirmed', 'yellow');
        if (hasCured) appendResult(result.cured, 'Cured', 'green') ;
        if (hasDead)  appendResult(result.dead, 'Dead', 'red');

        app.say(to, output.text);
    };

    app.Commands.set('coronavirus', {
        desc: '[Region] [Province?] Coronavirus stats',
        access: app.Config.accessLevels.identified,
        call: coronavirus,
    });

    // Return the script info
    return scriptInfo;
};
