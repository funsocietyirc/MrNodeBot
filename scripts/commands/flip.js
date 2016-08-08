'use strict';

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
                answer = app.random.bool()(app.randomEngine);
                break;
        }

        let rand = app.random.bool()(app.randomEngine);
        let randString = rand ? 'heads' : 'tails';
        let answerString = answer ? 'heads' : 'tails';
        let outcomeString = rand === answer ? 'win' : 'lose';

        app.Bot.say(to, `It was ${randString} you picked ${answerString}, you ${outcomeString}`);
    };

    // Flip a coin
    app.Commands.set('flip', {
        desc: '[heads / tails] Flip a coin',
        access: app.Config.accessLevels.guest,
        call: flip
    });
};
