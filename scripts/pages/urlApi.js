// Static Routes and pages
'use strict';

const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Bail out if we do not have a database
    if (!app.Database) {
        return;
    }

    console.log(Models.Url);
    // Provide URLs
    if (Models.Url) {
        const urlHandler = (req, res) => {
            Models.Url.query(qb => {
                    // If there is a channel in the query string
                    if (req.params.channel) {
                        qb.where('to', req.params.channel.replaceAll('%23', '#'));
                    }
                    // If there is a from in the query string
                    if (req.params.user) {
                        qb.where('from', req.params.user);
                    }
                    // Build Up Query
                    qb.orderBy('timestamp', req.query.sort || 'desc');
                })
                .fetchAll()
                .then(results => {
                    res.json({
                        results: results.toJSON(),
                        status: 'success'
                    });
                });
        };
        // Subscribe to web service
        app.WebRoutes.set('api.urls', {
            handler: urlHandler,
            desc: 'URL Link API',
            path: '/api/urls',
            name: 'api.urls',
            verb: 'get'
        });
    };
};
