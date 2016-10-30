'use strict';
const scriptInfo = {
    name: 'Nick Changes Web Front end',
    desc: 'Get information on aliases through web front end',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const Moment = require('moment');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Alias) {
        return;
    }

    // Web front end
    const frontEnd = (req, res) => {
        Models.Alias.fetchAll().then(results => {
            res.render('nickchanges', {
                results: results.toJSON(),
                moment: Moment
            });
        });
    };

    // Web Front End
    app.WebRoutes.set('nickchanges', {
        handler: frontEnd,
        path: '/nickchanges',
        desc: 'Nick Changes',
        name: 'nickchanges'
    });

    // Return the script info
    return scriptInfo;
};
