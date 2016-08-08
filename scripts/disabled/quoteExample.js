'use strict';

module.exports = app => {
    // Only enabled if there is a database available
    if (!app.Database && !app.Models.has('logging')) {
        return;
    };

    // Grab the model
    const logging = app.Models.get('logging');

    const pervQuote = (callback) => {
        new logging()
            .query(qb => {
                qb
                    .select('text')
                    .where('to', 'like', '#jackinchat')
                    .orderByRaw('rand()')
                    .limit(1)
            })
            .fetch()
            .then(result => {
                callback(result);
            });
    };

    const perv = (to, from, text, message) => {
        pervQuote((result) => {
            if (!result) {
                app.Bot.say(to, 'Nothing to see here');
                return;
            }
            app.Bot.say(to, `${result.get('text')}`);
        });
    };

    const listen = (to, from, text, message, is) => {
        if (!is.triggered && app.random.bool(1, is.privMsg ? 20 : process.env.pervFreq || 100)(app.randomEngine)) {
            pervQuote((result) => {
                if (!result) {
                    return;
                }
                app.Bot.say(to, `${from}, ${result.get('text')}`);
            });
        }
    };

    // Display a random perv quote
    app.Commands.set('perv', {
        desc: 'Get a pervy quote',
        access: app.Config.accessLevels.identified,
        call: perv
    });

    app.Listeners.set('perv', {
        desc: 'randomly say something weird',
        call: listen
    });
};
