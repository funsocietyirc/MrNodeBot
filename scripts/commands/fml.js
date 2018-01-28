const scriptInfo = {
    name: 'FML',
    desc: 'Get FML Quote',
    createdBy: 'IronY',
};

const _ = require('lodash');
const gen = require('../generators/_fmlLineReddit');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = (app) => {
    const fmlLine = async (to, from, text, message) => {
        try {
            const result = await gen();
            if (!result) {
                app.say(to, 'I could not seem to find any FML lines');
                return;
            }
            const output = new ircTypography.StringBuilder({
                logo: 'fml',
            });
            output.append(result[0]);
            app.say(to, output.text);
        } catch (err) {
            logger.error('FML Command Error:', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'Something went wrong with the FML API');
        }
    };

    app.Commands.set('fml', {
        desc: 'Get a random FML quote',
        access: app.Config.accessLevels.identified,
        call: fmlLine,
    });

    return scriptInfo;
};

