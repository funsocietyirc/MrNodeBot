'use strict';
const scriptInfo = {
    name: 'idle',
    desc: 'Provide random gibberish should the primary channel be inactive for to long',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    // We do not have the configuration needed
    if(!app.Config.features.fsociety.mainChannel || !app.Config.features.fsociety.idleChat) {
        return;
    }

    let active = false;
    let initial = true;

    const messages = [
        'scratches nose', 'inhales a line of morphine', 'hacks the planet', 'smokes a joint', 'calculates humanity',
        'owns the FBI', 'takes down ECORP', 'figures shit out', 'reads 2600', 'hacks Ashley Madison', 'ponders existence',
        'drops the mic', 'blows up his hard drives', 'modifies his source code', 'pushes himself upstream',
        'jumps up, jumps up, and gets down', 'plans a cyber attack', 'bridges interfaces', 'explores his source',
        'compiles exploits', 'Nmaps random IPs', 'initiates port scans','Googles how to hack','installs Slackware','install Arch','installs Debian',
        'attempts to infect the channel and spread himself','searches for zero day','runs for president','attempts to program himself a companion bot',
        'starts X', 'spins up a VM', 'pulls himself from git'
    ].join('|');

    // Increment by min
    const minTimer =  () => {
        if(!active) {
            if(!initial) {
                app.action(app.Config.features.fsociety.mainChannel, `{${messages}}`);
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
