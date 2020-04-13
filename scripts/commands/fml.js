const scriptInfo = {
    name: 'FML',
    desc: 'Get FML Quote',
    createdBy: 'IronY',
};

const _ = require('lodash');
const fml = require('../generators/_fmlLine');
const tifu = require('../generators/_tifuLine');
const til = require('../generators/_tilLine');

const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    /**
     * FML Line handler
     * @param to
     * @returns {Promise<void>}
     */
    const fmlLine = async to => {
        try {
            const result = await fml();
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

    /**
     * TIFU Handler
     * @param to
     * @returns {Promise<void>}
     */
    const tifuLine = async to => {
        try {
            const result = await tifu();
            if (!result) {
                app.say(to, 'I could not seem to find any TIFU lines');
                return;
            }
            const output = new ircTypography.StringBuilder({
                logo: 'tifu',
            });
            output.append(result[0].replace('TIFU', ''));
            app.say(to, output.text);
        } catch (err) {
            logger.error('FML Command Error:', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'Something went wrong with the TIFU API');
        }
    };
    app.Commands.set('tifu', {
        desc: 'Get a random TIFU quote',
        access: app.Config.accessLevels.identified,
        call: tifuLine,
    });

    /**
     * TIL Handler
     * @param to
     * @returns {Promise<void>}
     */
    const tilLine = async to => {
        try {
            const result = await til();
            if (!result) {
                app.say(to, 'I could not seem to find any TIL lines');
                return;
            }
            const output = new ircTypography.StringBuilder({
                logo: 'til',
            });
            output.append(result[0].replace('TIL', ''));
            app.say(to, output.text);
        } catch (err) {
            logger.error('FML Command Error:', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'Something went wrong with the TIL API');
        }
    };
    app.Commands.set('til', {
        desc: 'Get a random TIL quote',
        access: app.Config.accessLevels.identified,
        call: tilLine,
    });

    return scriptInfo;
};

