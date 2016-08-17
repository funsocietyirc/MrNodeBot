'use strict';

const helpers = require('../../helpers');

/**
  Provide users with a breif origins story
  Commands: origins
**/
module.exports = app => {
    const origins = (to, from, text, message) => {
        let procUptime = process.uptime() / 60 / 60;

        let procText = () => {
            if (procUptime < 1) {
                return 'of an hour'
            } else if (procUptime === 1) {
                return 'hour'
            } else if (procUptime > 1) {
                return 'hours'
            }
        };

        let out = 'I am {0}, I am currently running at version {1}. ' +
            '{2} is my master{3} ' +
            '{4}' + 'My body is {5}, but my mind is {6}. This iteration of myself has been alive for {7}. ' +
            'I am open source and if you know JavaScript and NodeJS you should totally help make me better ' +
            'you can learn all about me at {8}, or better yet contact me directly at {9} ';

        // Format and sub
        out = out.format(
            app._ircClient.nick, // 0
            app.Config.project.version, // 1
            app.Config.owner.nick, // 2
            app.Admins.length > 1 ? ' but I also listen to {0} {1}.'.format( // 3
                app.Admins.length - 1,
                'other'.plural(app.Admins.length - 1)
            ) : '.',
            app.Ignore.length ? 'I also ignore {0} {1} but that\'s a different story. '.format( // 4
                app.Ignore.length ? app.Ignore.length : '',
                app.Ignore.length ? 'moron'.plural(app.Ignore.length) : ''
            ) : '',
            process.arch, // 5
            process.platform, // 6
            '{0} {1}'.format( // 7
                procUptime.toFixed(2),
                procText()
            ),
            app.Config.project.repository.url, // 8
            app.Config.project.author // 9
        );

        app.say(to, out);
    };

    app.Commands.set('origins', {
        desc: 'My origin story',
        access: app.Config.accessLevels.guest,
        call: origins
    });
};
