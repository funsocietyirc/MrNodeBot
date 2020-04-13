const scriptInfo = {
    name: 'flip',
    desc: 'Simulate a coin toss, Random Engine test script',
    createdBy: 'IronY',
};

const logger = require('../../lib/logger');
const random = require('../../lib/randomEngine');
const ircTypo = require('../lib/_ircTypography');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = app => {
    /**
     * Flip Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const flip = async (to, from, text) => {
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
            const original = await Models.FlipStats.query(qb => qb.where('from', from)).fetch();

            try {
                if (original) {
                    const prop = isWinner ? 'wins' : 'losses';
                    original.set(prop, original.get(prop) + 1);

                    // Save
                    await original.save();
                } else {
                    await Models.FlipStats.create({
                        from,
                        losses: !isWinner ? 1: 0,
                        wins: isWinner ? 1 : 0,
                    });
                }
            } catch (err) {
                logger.error('Something went wrong saving a Flip Stat', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
            }
        }
    };
    app.Commands.set('flip', {
        desc: '[heads / tails] Flip a coin',
        access: app.Config.accessLevels.guest,
        call: flip,
    });

    // Return the script info
    return scriptInfo;
};
