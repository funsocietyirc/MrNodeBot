const scriptInfo = {
    name: 'definition',
    desc: 'Get definitions of stuff',
    createdBy: 'IronY',
};

const _ = require('lodash');
const gen = require('../generators/_getDefinition');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = (app) => {
    const getDefinition = async (to, from, text, message) => {
        if (_.isEmpty(text.trim())) {
            app.say(to, `I am sorry ${from}, I need something to lookup`);
            return;
        }
        try {
            const sb = new ircTypography.StringBuilder({
                logo: 'dictionary',
            });
            const results = await gen(text);
            sb
                .append(from)
                .append(text)
                .append(results.date)
                .append(results.type)
                .insert(results.definition)
                .insertIcon('anchor')
                .insert(results.link);

            app.say(to, sb.toString());
        } catch (err) {
            if ('innerErr' in err) {
                logger.error('Something went wrong fetching a definition', {
                    message: err.innerErr.message || '',
                    stack: err.innerErr.stack || '',
                });
            }

            app.say(to, `${err.message}, ${from}`);
        }
    };

    // Echo Test command
    app.Commands.set('definition', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.identified,
        call: getDefinition,
    });

    // Return the script info
    return scriptInfo;
};
