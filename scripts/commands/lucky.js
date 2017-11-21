const scriptInfo = {
    name: 'lucky',
    desc: 'Russian Roulette-ish',
    createdBy: 'IronY',
};

const Models = require('funsociety-bookshelf-model-loader');

const random = require('../../lib/randomEngine');
const logger = require('../../lib/logger');

const revolverRounds = 6;

module.exports = (app) => {
    let round;

    const lucky = async (to, from, text, message) => {
        // Initialize Player
        if (!round.has(from)) round.set(from, revolverRounds);

        // Get chambers remaining
        const remaining = round.get(from);

        app.action(to, `points a ${revolverRounds} chamber revolver with one round loaded at ${from}, and spins (${remaining} slots remaining)`);

        // Calculate new remaining
        const newRemaining = remaining - 1;

        // Set or Reset
        round.set(from, newRemaining === 0 ? revolverRounds : newRemaining);

        // Wait
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Simulate putting the bullet in a random chamber, spinning the chamber, and seeing if it pops
        const loadedChamber = random.integer(1, remaining) === 1;

        // Chamber was not loaded
        if (!loadedChamber) {
            app.say(to, `*click* - Looks like you get to live another day ${from}`);
        } else {
            // Check if bot is op in channel
            if (app._ircClient.isOpInChannel(to)) {
                app._ircClient.send('kick', to, from, `*BANG* *BANG* ${app._ircClient.nick} shot me down, *BANG* BANG*`);
            }
            // Bot is not op in channel
            else {
                app.action(to, `shoots ${from} in the foot`);
            }

            // Reset
            round.set(from, revolverRounds);
        }

        if (Models.RouletteStats) {
            // Async Save
            Models.RouletteStats
                .findOrCreate({
                    from,
                }, {
                    fired: 1,
                    hit: 0,
                })
                .then((result) => {
                    result.set('fired', result.get('fired') + 1);
                    if (loadedChamber) {
                        result.set('hit', result.get('hit') + 1);
                    }
                    // Save
                    result.save();
                })
                .catch((err) => {
                    logger.error('Something went wrong saving a Roulette Stat', {
                        message: err.message || '',
                        stack: err.stack || '',
                    });
                });
        }
    };

    const onLoad = () => round = new Map();

    const onUnload = () => round.clear();

    // Hello Test command
    app.Commands.set('lucky', {
        desc: 'Are you feeling lucky punk',
        access: app.Config.accessLevels.guest,
        call: lucky,
    });

    // Return the script info
    return Object.assign({}, scriptInfo, {
        onLoad,
        onUnload,
    });
};
