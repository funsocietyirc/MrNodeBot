'use strict';

module.exports = app => {
    let active = false;

    const messages = [
        'scratches nose', 'inhales a line of morphine', 'hacks the planet', 'smokes a joint', 'calculates humanity',
        'owns the FBI', 'takes down ECORP', 'figures shit out', 'reads 2600', 'hacks Ashley Madison', 'ponder existance',
        'drops the mic','thinks alloud', 'blows up his hardrives', 'modifys his source code', 'pushes himself upstream',
        'jumps up, jumps up, and gets down'
    ].join('|');

    // Increment by min
    const minTimer =  () => {
        if(!active) {
            app.action(app.Config.features.darkArmy.mainChannel, `{${messages}}`);
        }
        active = false;
        setTimeout(minTimer, app.Config.features.darkArmy.idleChat *  60000);
    };
    minTimer();

    //  check for active
    const setActive = (channel,topic,nick,message) => {
        if(channel == app.Config.features.darkArmy.mainChannel) {
            active = true;
        }
    };

    // Add the channel listener
    app.Listeners.set('fsocietyActive', {
        call: setActive,
        desc: 'fsocietyActive',
    });

};
