'use strict';
const scriptInfo = {
    name: 'flip',
    desc: 'Simulate a coin toss, Random Engine test script',
    createdBy: 'IronY'
};
const random = require('../../lib/randomEngine');

module.exports = app => {
    // Flip a coin
    app.Commands.set('flip', {
        desc: '[heads / tails] Flip a coin',
        access: app.Config.accessLevels.guest,
        call: (to, from, text, message) => {
            let [selection] = text.split(' ');
            let answer = false;
            switch (selection) {
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
            let outcomeString = rand === answer ? 'Winner' : 'Loser';

            app.say(to, `It was ${randString} you picked ${answerString}, you are the ${outcomeString}`);
        }
    });

    // Return the script info
    return scriptInfo;
};
