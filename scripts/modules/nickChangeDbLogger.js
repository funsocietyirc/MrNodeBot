'use strict';

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !app.Models.has('alias')) {
        return;
    }

    // Grab Model
    const aliasModel = app.Models.get('alias');

    // Handler
    const nickChange = (oldnick, newnick, channels, message) => {
        // If we have a database connection, log
        new aliasModel({
                oldnick: oldnick,
                newnick: newnick,
                channels: channels.toString()
            })
            .save()
            .catch(err => {
                console.log(err.message);
            });
    };

    const frontEnd = (req, res) => {
        new aliasModel().fetchAll().then( results => {
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
