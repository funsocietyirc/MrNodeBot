const scriptInfo = {
    name: 'Let me google that for you',
    desc: 'Grab a let me google that for you link',
    createdBy: 'IronY',
};
const gen = require('../lib/_getShortService')();
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = (app) => {
    const lmgtfy = async (to, from, text, message) => {
        if (!text) {
            app.say(to, 'You need to give me some more information...');
            return;
        }
        try {
            // Grab result
            const result = await gen(`http://lmgtfy.com/?q=${encodeURIComponent(text)}`);
            // Report back
            app.say(to, !result ?
                'Something went wrong figuring that out for you' :
                `${ircTypography.logos.lmgtfy} ${result}`);
        } catch (err) {
            logger.error('Something went wrong in the LMGTFY command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong fetching LMGTFY data for you ${from}`);
        }
    };
    app.Commands.set('lmgtfy', {
        desc: '[search text] - Figure something out for someone',
        access: app.Config.accessLevels.identified,
        call: lmgtfy,
    });

    return scriptInfo;
};
