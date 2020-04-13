const scriptInfo = {
    name: 'randomWebLine',
    desc: 'Get a random web line',
    createdBy: 'IronY',
};

const gen = require('../generators/_randomWebline');

module.exports = app => {
    /**
     * Random Web Line Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const randomWebLineHandler = async (to, from) => {
        try {
            const line = await gen();
            app.say(to, `${line}`);
        } catch (err) {
            app.say(to, `Something went wrong fetching your line, ${from}`);
        }
    };

    app.Commands.set('random-webline', {
        desc: 'Get a random web line',
        access: app.Config.accessLevels.identified,
        call: randomWebLineHandler,
    });

    // Return the script info
    return scriptInfo;
};
