'use strict';
const scriptInfo = {
    name: 'origins',
    desc: 'Show the Bots current uptime and other statistics',
    createdBy: 'Dave Richer'
};

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

        let additionalAdmins = app.Admins.length > 1 ?
            ` but I also listen to ${app.Admins.length -1} ${helpers.Plural('other', app.Admins.length)}` : '.';
        let ignoreList = app.Ignore.length ?
            `I also ignore ${app.Ignore.length} ${helpers.Plural('moron', app.Ignore.length)} but that is a different story.` : '';
        let uptimeText = `${procUptime.toFixed(2)} ${procText()}`;

        let out = `I am ${app._ircClient.nick}, I am currently running at version ${app.Config.project.version}. ` +
            `${app.Config.owner.nick} is my master${additionalAdmins} ` +
            `${ignoreList}My body is ${process.arch}, but my mind is ${process.platform}. This iteration of myself has been alive for ${uptimeText}. ` +
            `I am open source and if you know JavaScript and NodeJS you should totally help make me better ` +
            `you can learn all about me at ${app.Config.project.repository.url}, or better yet contact me directly at ${app.Config.project.author} `;

        app.say(from, out);
    };

    app.Commands.set('origins', {
        desc: 'My origin story',
        access: app.Config.accessLevels.guest,
        call: origins
    });

    // Return the script info
    return scriptInfo;
};
