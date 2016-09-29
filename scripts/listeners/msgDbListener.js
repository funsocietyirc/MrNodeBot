'use strict';
const scriptInfo = {
    name: 'mesgDbListener',
    file: 'msgDbListener.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');

/** Log all incoming channel messages to a Sql Database **/
module.exports = app => {
    // Assure the database and logging table exists
    if (!app.Database && !Models.Logging) {
        return;
    }

    const loggingModel = Models.Logging;

    // Handler
    const loggingCmd = (to, from, text, message) => {
        loggingModel.create({
                from: from,
                to: to,
                text: require('irc-colors').stripColorsAndStyle(text),
                ident: message.user,
                host: message.host
            })
            .catch(err => {
                console.log(err.message);
            });
    };

    // Listen and Log
    app.Listeners.set('databaseLogging', {
        desc: 'Log everything to a database',
        call: loggingCmd
    });

    // Return the script info
    return scriptInfo;
};
