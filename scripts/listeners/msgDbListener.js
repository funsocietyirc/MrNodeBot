'use strict';

/** Log all incoming channel messages to a Sql Database **/
module.exports = app => {
    // Asure the database and logging table eixsts
    if (!app.Database && !app.Models.has('logging')) {
        return;
    }

    const loggingModel = app.Models.get('logging');

    // Handler
    const loggingCmd = (to, from, text, message) => {
        new loggingModel({
                from: from,
                to: to,
                text: require('irc-colors').stripColorsAndStyle(text),
                ident: message.user,
                host: message.host
            })
            .save()
            .catch(err => {
                console.log(err.message);
            });
    };

    // Listen and Log
    app.Listeners.set('databaseLogging', {
        desc: 'Log everything to a database',
        call: loggingCmd
    });
};
