const scriptInfo = {
    name: 'origins',
    desc: 'Show the Bots current up-time and other statistics',
    createdBy: 'IronY',
};

const {gitlogPromise} = require('gitlog');
const short = require('../lib/_getShortService')();
const originText = require('../lib/_originText');

// Commands: origins
module.exports = app => {
    /**
     * Get Origins
     * @param to
     * @param from
     */
    const originsHandler = (to, from) => {
        // Get Origin Text
        const out = originText(app);
        // Say
        app.say(from, out);
        if (to !== from) app.say(to, `I have private messaged you my origin story, ${from}`);
    };
    app.Commands.set('origins', {
        desc: 'My origin story',
        access: app.Config.accessLevels.guest,
        call: originsHandler,
    });

    /**
     * Get the version
     * @param to
     * @param from
     */
    const versionHandler = async (to, from) => {
        try {
            const commits = await gitlogPromise(app.Config.gitLog);
            // Exit on error
            if (!commits || !commits[0]) {
                app.say(to, `My current state of mind is ${app.Config.project.version}, ${from}`);
                return;
            }
            const url = `${app.Config.project.repository.url}/commit/${commits[0].abbrevHash}`;
            const shortUrl = await short(url);
            app.say(to, `My current state of mind is ${app.Config.project.version} (${commits[0].abbrevHash} | ${shortUrl}), ${from}`);
        }
        catch (err) {
            logger.error('Something went wrong in getVersion command', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, `My current state of mind is ${app.Config.project.version}, ${from}`);
        }
    };
    app.Commands.set('version', {
        desc: 'My Version',
        access: app.Config.accessLevels.guest,
        call: versionHandler,
    });

    return scriptInfo;
};
