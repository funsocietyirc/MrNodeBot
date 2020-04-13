const scriptInfo = {
    name: 'apocalypse Dooms day clock',
    desc: 'Give mins to midnight',
    createdBy: 'IronY',
};
const gen = require('../generators/_doomsday');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    /**
     * ApocalypseHandler
     * @param to
     * @returns {Promise<void>}
     */
    const apocalypseHandler = async to => {
        try {
            const result = await gen();
            app.say(to, `${ircTypography.logos.m2m} is currently set to ${result}`);
        } catch (err) {
            app.say(to, `${ircTypography.logos.m2m} was unable to get the time, perhaps the world has already ended`);
        }
    };
    app.Commands.set('apocalypse', {
        desc: 'Get a reading from the Doomsday clock',
        access: app.Config.accessLevels.identified,
        call: apocalypseHandler,
    });
    // Return the script info
    return scriptInfo;
};
