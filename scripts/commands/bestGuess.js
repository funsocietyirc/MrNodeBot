const _ = require('lodash');
const scriptInfo = {
    name: 'Best Guess',
    desc: 'Best attempt to match a nickname',
    createdBy: 'IronY',
};
const gen = require('../generators/_nickBestGuess');

module.exports = (app) => {
    const bg = async (to, from, text, message) => {
        const [nick] = text.split(' ');
        if (!nick) {
            app.say(to, `You are going to have to give me something to work with ${from}`);
            return;
        }

        const result = await gen(nick, to);
        if(_.isEmpty(result) || _.isEmpty(result.nearestNeighbor) || _.isNull(result.nearestNeighbor.probability)) {
            app.say(to, `I got nothing, ${from}`);
            return;
        }

        app.say(to, `There is a ${(result.probability * 100).toFixed(2)}% chance you're looking for ${result.nearestNeighbor.from}, ${from}`);
    };

    app.Commands.set('bg', {
        desc: '[Nick] Best attempt to match a nickname',
        access: app.Config.accessLevels.identified,
        call: bg,
    });

    // Return the script info
    return scriptInfo;
};
