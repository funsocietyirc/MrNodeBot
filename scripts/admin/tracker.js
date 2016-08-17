'use strict';

const http = require('http');

/**
  Try and get the location of a user using geoip
  Commands: tracker
**/
module.exports = app => {
    const validHosts = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
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
            if(!validHosts.test(info.host)){
                app.say(to, `${from} seems to be hiding behind some sort of mask...`);
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
