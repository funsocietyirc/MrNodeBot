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
    if(!app.Config.features.fsociety.mainChannel || !app.Config.features.fsociety.idleChat) return;

    // Set Initial states
    let active = false;
    let initial = true;

    // Increment by min
    const minTimer =  () => {
        if(!active) {
            if(!initial) {
                _.sample([fml,bofh,shower])(1)
                  .then(message => app.notice(app.Config.features.fsociety.mainChannel, _.first(message)));
            } else {
                initial = false;
            }
        }
        active = false;
        setTimeout(minTimer, app.Config.features.fsociety.idleChat *  60000);
    };
    minTimer();

    //  check for active
    const setActive = (channel,topic,nick,message) => {
        // TODO make this open to other channels
        if(channel == app.Config.features.fsociety.mainChannel) {
            active = true;
        }
    };

    // Add the channel listener
    app.Listeners.set('fsocietyActive', {
        call: setActive,
        desc: 'fsocietyActive'
    });

    // Return the script info
    return scriptInfo;
};
