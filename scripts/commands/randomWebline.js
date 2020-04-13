const scriptInfo = {
    name: 'randomWebLine',
    desc: 'Get a random web line',
    createdBy: 'IronY',
};

const gen = require('../generators/_randomWebline');

module.exports = app => {
    app.Commands.set('random-webline', {
        desc: 'Get a random web line',
        access: app.Config.accessLevels.identified,
        call: async (to, from, text, message) => {
            try {
                const line = await gen();
                app.say(to, `${line}`);
            } catch (err) {
                app.say(to, `Something went wrong fetching your line, ${from}`);
            }
        },
    });

    // Return the script info
    return scriptInfo;
};
