'use strict';
const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Alias) {
        return;
    }

    // Grab Model
    const aliasModel = Models.Alias;

    // Handler
    const nickChange = (oldnick, newnick, channels, message) => {
        // If we have a database connection, log
        aliasModel.create({
                oldnick: oldnick,
                newnick: newnick
            })
            .catch(err => {
                console.log(err.message);
            });
    };

    const frontEnd = (req, res) => {
        aliasModel.fetchAll().then(results => {
            res.render('nickchanges', {
                results: results.toJSON(),
                moment: require('moment')
            });
        });
    };

    // Listen and Log
    app.NickChanges.set('databaseLogging', {
        desc: 'Log Nick changes to the alias table',
        call: nickChange
    });

    // Web Front End
    app.WebRoutes.set('nickchanges', {
        handler: frontEnd,
        path: '/nickchanges',
        desc: 'Nick Changes',
        name: 'nickchanges'
    });
};
