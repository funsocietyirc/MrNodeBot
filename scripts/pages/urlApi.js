// Static Routes and pages
'use strict';
const scriptInfo = {
    name: 'urlApi',
    file: 'urlApi.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Bail out if we do not have a database
    if (!app.Database && Models.Url) {
        return;
    }
    const urlHandler = (req, res) => {
        Models.Url.query(qb => {
                // If there is a channel in the query string
                if (req.query.channel) {
                    qb.where('to', req.query.channel.replaceAll('%23', '#'));
                }
                // If there is a from in the query string
                if (req.query.user) {
                    qb.where('from', req.query.user);
                }
                // Search for images only
                if (req.query.type) {
                    switch (req.query.type) {
                        case 'images':
                            qb.where(function() {
                                this
                                    .where('url', 'like', '%.jpeg')
                                    .orWhere('url', 'like', '%.jpg')
                                    .orWhere('url', 'like', '%.gif')
                                    .orWhere('url', 'like', '%.png');
                            });
                            break;
                        default:
                    }
                }
                // Build Up Query
                qb.orderBy('timestamp', req.query.sort || 'desc');
            })
            .fetchPage({
                pageSize: req.query.pageSize || 25,
                page: req.query.page || 1
            })
            .then(results => {
                res.json({
                    rowCount: results.pagination.rowCount,
                    pageCount: results.pagination.pageCount,
                    page: results.pagination.page,
                    pageSize: results.pagination.pageSize,
                    status: 'success',
                    results: results.toJSON()
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

    // Return the script info
    return scriptInfo;
};
