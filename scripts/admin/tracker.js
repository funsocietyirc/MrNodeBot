'use strict';

const http = require('http');

/**
  Try and get the location of a user using geoip
  Commands: tracker
**/
module.exports = app => {
    // Handler
    const tracker = (to, from, text, message) => {
        var user = text.getFirst();

        if (!user) {
            app.say(to, 'You must specify a user as a the first argument');
            return;
        }

        app._ircClient.whois(user, (info) => {
            if (!info) {
                app.say(to, 'Something has gone very wrong');
                return;
            }
            let options = {
                host: 'freegeoip.net',
                port: 80,
                path: `/json/${info.host}`,
                method: 'GET'
            };
            http.request(options, res => {
                res.setEncoding('utf8');
                res.on('data', chunk => {
                    if (res.statusCode !== 200) {
                        app.say(to, `${user} has been hidden by a power much greater than mine`);
                        return;
                    }
                    let results = JSON.parse(chunk);
                    let zipString = results.zip_code ? `Zip ${results.zip_code}` : '';
                    let metroString = results.metro_code ? `Metro ${results.metro_code}` : '';
                    let timezoneString = results.time_zone ? `Time Zone ${results.time_zone}` : '';
                    app.say(to, `I have tracked ${user} down to ${results.city}, ${results.region_name},
                      ${results.country_name} (${results.latitude}, ${results.longitude}) ${zipString}
                      ${metroString} ${timezoneString}`);
                });
            }).on('error', err => {
                app.action(to, 'tinkers with his satellite uplink');
            }).end();
        });
    };

    app.Commands.set('track', {
        desc: 'Track someone',
        access: app.Config.accessLevels.admin,
        call: tracker
    });
};
