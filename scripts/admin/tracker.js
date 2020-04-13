const scriptInfo = {
    name: 'tracker',
    desc: 'Get GEO IP info on a IRC user',
    createdBy: 'IronY',
};
const _ = require('lodash');
const gen = require('../generators/_ipLocationData');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');

// Try and get the location of a user using geoip
// Commands: tracker
module.exports = app => {
    // Handler
    const tracker = async (to, from, text, message) => {
        const [user] = text.split(' ');
        const finalUser = user || from;

        if (!finalUser) {
            app.say(to, 'You must specify a user as a the first argument');
            return;
        }

        try {
            const info = await app._ircClient.whoisPromise(finalUser);

            if (!helpers.ValidHostExpression.test(info.host)) {
                app.say(to, `${finalUser} seems to be hiding behind some sort of mask... Better luck next time ${from}`);
                return;
            }

            try {
                const results = await gen(info.host);
                const zipString = results.zip_code ? `Zip ${results.zip_code}` : '';
                const metroString = results.metro_code ? `Metro ${results.metro_code}` : '';
                const timezoneString = results.time_zone ? `Time Zone ${results.time_zone}` : '';
                app.say(to, `I have tracked ${finalUser} down to ${results.city}, ${results.region_name}, ${results.country_name} (${results.latitude}, ${results.longitude}) ${zipString} ${metroString} ${timezoneString}`);
            } catch (innerErr) {
                logger.error('Tracker Error', {
                    message: innerErr.message || '',
                    stack: innerErr.stack || '',
                });
                app.action(to, 'tinkers with his satellite uplink');
            }
        } catch (err) {
            app.say(to, err.message);
        }
    };

    app.Commands.set('track', {
        desc: 'Track someone',
        access: app.Config.accessLevels.admin,
        call: tracker,
    });

    // Return the script info
    return scriptInfo;
};
