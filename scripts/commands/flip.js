'use strict';
const scriptInfo = {
    name: 'flip',
    desc: 'Simulate a coin toss, Random Engine test script',
    createdBy: 'Dave Richer'
};

const random = require('../../lib/randomEngine');

module.exports = app => {
    const flip = (to, from, text, message) => {
        let txtArray = text.split(' ');

        let answer = false;
        switch (txtArray[0]) {
            case 'heads':
                answer = true;
                break;
            case 'tails':
                answer = false;
                break;
            default:
                answer = random.bool();
                break;
        }

        let rand = random.bool();
        let randString = rand ? 'heads' : 'tails';
        let answerString = answer ? 'heads' : 'tails';
        let outcomeString = rand === answer ? 'win' : 'lose';

        app.say(to, `It was ${randString} you picked ${answerString}, you ${outcomeString}`);
    };

    // Flip a coin
    app.Commands.set('flip', {
        desc: '[heads / tails] Flip a coin',
        access: app.Config.accessLevels.guest,
        call: flip
    });

    // Return the script info
    return scriptInfo;
};
