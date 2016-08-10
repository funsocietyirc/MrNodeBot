'use strict';
// Time related commands
module.exports = app => {
    const moment = require('moment');
    const measures = ['weeks', 'days', 'hours', 'minutes', 'seconds'];
    const day = 3; // Wens
    const hour = 22;

    const itsHappening = (to, from, text, message) => {
        let nextDay = moment().day(day).hour(hour);
        let nextEpisode = moment.duration(nextDay.diff(moment()));
        let outputArray = [];
        measures.forEach(measure => {
            if (nextEpisode[measure]() != 0) {
                let value = nextEpisode[measure]();
                outputArray.push(`${value} ${measure}`);
            }
        });
        let countDown = outputArray.join(', ');
        app.Bot.say(to, `The next episode of Mr. Robot airs in: ${countDown} (Eastern Standard Time)`);
    };

    app.Commands.set('next-episode', {
        desc: 'next-episode - Get the count down for the next episode of Mr. Robot',
        access: app.Config.accessLevels.guest,
        call: itsHappening
    });
};
