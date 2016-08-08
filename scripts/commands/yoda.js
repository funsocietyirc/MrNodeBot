'use strict';

/**
  Repeat user input as yoda
  Commands: yoda
**/
module.exports = app => {
    if (!app.Config.mashableAPI) {
        return;
    }

    const unirest = require('unirest');

    const yoda = (to, from, text, message) => {
        unirest.get("https://yoda.p.mashape.com/yoda?sentence={0}".format(text.replace(' ', '+')))
            .header("X-Mashape-Key", app.Config.mashableAPI)
            .header("Accept", "text/plain")
            .end(result => {
                if (result && result.status == 200)
                    app.Bot.say(to, result.body);
            });
    };

    // Fairly self explanatory
    app.Commands.set('yoda', {
        desc: '[message] Speak like yoda you will',
        access: app.Config.accessLevels.guest,
        call: yoda
    });
};
