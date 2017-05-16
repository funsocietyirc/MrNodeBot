'use strict';
const scriptInfo = {
    name: 'tracker',
    desc: 'Get GEO IP info on a IRC user',
    createdBy: 'IronY'
};
const _ = require('lodash');
const gen = require('../generators/_ipLocationData');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');

// Try and get the location of a user using geoip
// Commands: tracker
module.exports = app => {
    // Handler
    const tracker = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [user] = textArray;
        user = user || from;
        if (!user) {
            app.say(to, 'You must specify a user as a the first argument');
            return;
        }

        app._ircClient.whoisPromise(user)
            .then(info => {
                if (!helpers.ValidHostExpression.test(info.host)) {
                    app.say(to, `${from} seems to be hiding behind some sort of mask...`);
                    return;
                }
                gen(info.host)
                    .then(results => {
                        let zipString = results.zip_code ? `Zip ${results.zip_code}` : '';
                        let metroString = results.metro_code ? `Metro ${results.metro_code}` : '';
                        let timezoneString = results.time_zone ? `Time Zone ${results.time_zone}` : '';
                        app.say(to, `I have tracked ${user} down to ${results.city}, ${results.region_name}, ${results.country_name} (${results.latitude}, ${results.longitude}) ${zipString} ${metroString} ${timezoneString}`);
                    })
                    .catch(err => {
                        logger.error('Tracker Error', {
                            err
                        });
                        app.action(to, 'tinkers with his satellite uplink');
                    });
            })
            .catch(err => app.say(to, err.message));
    };

    app.Commands.set('track', {
        desc: 'Track someone',
        access: app.Config.accessLevels.admin,
        call: tracker
    });

    // Return the script info
    return scriptInfo;
};
