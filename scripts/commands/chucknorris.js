'use strict';

const scriptInfo = {
    name: 'Chuck Norris',
    desc: 'Retrieve a random chuck joke',
    createdBy: 'IronY'
};

const typo = require('../lib/_ircTypography');
const gen = require('../generators/_getChuckNorris');

module.exports = app => {
    const chuck = (to, from, text, message) => gen()
        .then(value => app.say(to, `${typo.logos.chuckNorris}: ${value}`))
        .catch(e => app.say(to, `${typo.logos.chuckNorris}: ${e.message || 'Something went wrong...'}`));

    app.Commands.set('chuck', {
        desc: scriptInfo.desc,
        access: app.Config.accessLevels.identified,
        call: chuck
    });

    return scriptInfo;
}
