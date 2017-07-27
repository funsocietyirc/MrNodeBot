'use strict';
const scriptInfo = {
    name: 'flip',
    desc: 'Simulate a coin toss, Random Engine test script',
    createdBy: 'IronY'
};
const random = require('../../lib/randomEngine');
const ircTypo = require('../lib/_ircTypography');

module.exports = app => {
    // Flip a coin
    app.Commands.set('flip', {
        desc: '[heads / tails] Flip a coin',
        access: app.Config.accessLevels.guest,
        call: (to, from, text, message) => {
            const [selection] = text.split(' ');

            let answer;
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

            const rand = random.bool();
            const isWinner = rand === answer;

            const sb = new ircTypo.StringBuilder();

            sb
                .insert(
                    `${from}, your coin landed on`
                )
                .appendBold(
                    rand ? 'Heads' : 'Tails'
                )
                .insert('you picked')
                .appendBold(
                    answer ? 'Heads' : 'Tails'
                )
                .insert('you are the')
                .appendBold(
                    isWinner ? 'Winner' : 'Loser'
                )
                .insertIcon(
                    isWinner ? 'upArrow' : 'downArrow'
                )
                .appendBold(
                    outcomeString
                );

            app.say(to, sb.toString());
        }
    });

    // Return the script info
    return scriptInfo;
};
