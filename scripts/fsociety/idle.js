'use strict';
const scriptInfo = {
    name: 'idle',
    desc: 'Provide random gibberish should the primary channel be inactive for to long',
    createdBy: 'IronY'
};

const _ = require('lodash');
const fml = require('../generators/_fmlLine');
const bofh = require('../generators/_bofhExcuse');
const shower = require('../generators/_showerThoughts');

module.exports = app => {
    // We do not have the configuration needed
    if (
        _.isUndefined(app.Config.features.fsociety) ||
        !_.isSafeInteger(_.parseInt(app.Config.features.fsociety.idleChat)) ||
        !_.isString(app.Config.features.fsociety.mainChannel) ||
        _.isEmpty(app.Config.features.fsociety.mainChannel)
    ) return scriptInfo;

    // Hold delay
    let delayInMins = app.Config.features.fsociety.idleChat * 60000;

    // Set Initial states
    let active = false;
    let initial = true;

    // Increment by min
    const minTimer = () => {
        if (!active) {
            if (!initial) {
                _.sample([fml, bofh, shower])(1)
                    .then(message => app.notice(app.Config.features.fsociety.mainChannel, _.first(message)));
            } else {
                initial = false;
            }
        }

        active = false;
        setTimeout(minTimer, delayInMins);
    };

    // Set off first cycle
    minTimer();

    // Add the channel listener
    app.Listeners.set('fsocietyActive', {
        desc: 'fsocietyActive',
        call: (channel, topic, nick, message) => {
            active = (channel == app.Config.features.fsociety.mainChannel);
        }
    });

    // Return the script info
    return scriptInfo;
};
