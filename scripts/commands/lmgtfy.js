'use strict';
const scriptInfo = {
    name: 'Let me google that for you',
    desc: 'Grab a let me google that for you link',
    createdBy: 'Dave Richer'
};

const ircTypography = require('../lib/_ircTypography');
const gen = require('../generators/_isGdShortUrl');

module.exports = app => {
    const lmgtfy = (to, from, text, message) => {
        if (!text) {
            app.say(to, 'You need to give me some more information...');
            return;
        }
        gen('http://lmgtfy.com/?q=' + encodeURIComponent(text))
            .then(result => {
              console.dir(result);
                if (!result.shorturl) {
                    app.say(to, 'Something went wrong figuring that out for you');
                    return;
                }
                app.say(to, `${ircTypography.logos.lmgtfy} ${result.shorturl}`);
            })
            .catch(err => {
                console.log('LMGTFY Error');
                console.dir(err);
            });
    };

    app.Commands.set('lmgtfy', {
        desc: '[search text] - Figure something out for someone',
        access: app.Config.accessLevels.identified,
        call: lmgtfy
    });

    return scriptInfo;
};
