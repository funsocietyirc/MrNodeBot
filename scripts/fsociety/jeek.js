'use static';
const scriptInfo = {
    name: 'jeek',
    file: 'jeek.js',
    desc: 'Is Jeek alive?',
    createdBy: 'Dave Richer'
};

const xray = require('x-ray')();
const Models = require('bookshelf-model-loader');

module.exports = (app) => {
    const jeek = (to, from, text, message) => xray('http://ishealive.jeek.net', ['h1'])((err, results) => {
        if (err || !results || !results[1]) {
            app.say(to, 'Something went wrong finding out if jeek is alive')
            return;
        }
        app.say(to, `Is Jeek Alive? ${results[1]}`);
    });

    const mother = (to, from, text, message) => {
        if (!Models.Logging) return;
        Models.Logging.query(qb =>
          qb
          .select(['text'])
          .where('text', 'like', '%mother%')
          .andWhere('from', 'like', 'jeek')
          .orderByRaw('rand()')
          .limit(1)
        )
        .fetchOne()
        .then(results => {
          if(!results) return;
          app.say(to, results.get('text'));
        });
    }

    // Total Messages command
    app.Commands.set('jeek', {
        desc: 'Is Jeek Alive?',
        access: app.Config.accessLevels.identified,
        call: jeek
    });

    app.Commands.set('mother', {
        desc: 'Get a your mother line care of Jeek',
        access: app.Config.accessLevels.identified,
        call: mother
    })
    return scriptInfo;
};
