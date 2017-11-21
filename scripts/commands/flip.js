const scriptInfo = {
    name: 'flip',
    desc: 'Simulate a coin toss, Random Engine test script',
    createdBy: 'IronY',
};

const logger = require('../../lib/logger');
const random = require('../../lib/randomEngine');
const ircTypo = require('../lib/_ircTypography');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = (app) => {
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
                .insert(`${from}, your coin landed on`)
                .appendBold(rand ? 'Heads' : 'Tails')
                .insert('you picked')
                .appendBold(answer ? 'Heads' : 'Tails')
                .insert('you are the')
                .insertIcon(isWinner ? 'upArrow' : 'downArrow')
                .appendBold(isWinner ? 'Winner' : 'Loser');

            app.say(to, sb.toString());

            if (Models.FlipStats) {
                // Async Save
                Models.FlipStats
                    .findOrCreate({
                        from,
                    }, {
                        wins: 0,
                        losses: 0,
                    })
                    .then((result) => {
                        const prop = isWinner ? 'wins' : 'losses';
                        result.set(prop, result.get(prop) + 1);

                        // Save
                        result.save();
                    })
                    .catch((err) => {
                        logger.error('Something went wrong saving a Flip Stat', {
                            message: err.message || '',
                            stack: err.stack || '',
                        });
                    });
            }
        },
    });

    // Return the script info
    return scriptInfo;
};
