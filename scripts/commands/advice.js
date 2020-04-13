const scriptInfo = {
    name: 'Advice',
    desc: 'Retrieve a advice slip',
    createdBy: 'IronY',
};
const gen = require('../generators/_getAdviceSlip');
const logger = require('../../lib/logger');

module.exports = app => {
    /**
     * Advice Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const advice = async (to, from, text) => {
        try {
            const value = await gen(text);
            if(!value) {
                app.say(to, `For once in my life I have no advice, ${from}`);
                return;
            }
            app.say(to, `Advice: ${value}`);
        } catch (err) {
            logger.error('Something went wrong in the advice command file', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `I am sorry ${from}, the computer I go to for advice is sleeping`);
        }
    };

    app.Commands.set('advice', {
        desc: scriptInfo.desc,
        access: app.Config.accessLevels.identified,
        call: advice,
    });

    return scriptInfo;
};
