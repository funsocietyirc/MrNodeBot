// Static Routes and pages
'use strict';
const scriptInfo = {
    name: 'urlApi',
    file: 'urlApi.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const _ = require('lodash');

module.exports = app => {
    // Bail out if we do not have a database
    if (!app.Database && Models.Url) {
        return;
    }

    /**
      Build the Base query.
      args:
        req - express quest
        callback

      query params:
        type:
          images -- will filter based on image file types
        user -- matches user
        channel -- matches channel

    **/
    const applyQuery = req => Models.Url.query(qb => {

        // Apply Where conditions
        let where = {};
        if (req.query.channel) {
            where.to = eq.query.channel.replaceAll('%23', '#');
        }
        if (req.query.user) {
            where.from = req.query.user;
        }
        if (where.to || where.from) {
            qb = qb.where(where);
        }

        // Search for images only
        if (req.query.type) {
            switch (req.query.type) {
                case 'images':
                    qb = qb.andWhere(function() {
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
        qb = qb.orderBy('timestamp', req.query.sort || 'desc');
    });

    /**
      Get the available sources.
      Returns a unique list of combined nicks and channels
    **/
    const sourcesHandler = (req, res) => {
        applyQuery(req, qb => {
                return qb.select(['from', 'to']);
            })
            .fetchAll()
            .then(results => {
                let channels = _.uniqBy(results.pluck('to'));
                let nicks = _.uniqBy(results.pluck('from'));
                res.json({
                    status: 'success',
                    results: {
                        channels,
                        nicks,
                        count: channels.length + nicks.length
                    }
                });
            });
    };

    /**
      Get list of available urls
    **/
    const urlHandler = (req, res) => {
        applyQuery(req)
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
    app.WebRoutes.set('api.sources', {
        handler: sourcesHandler,
        desc: 'Get the available sources',
        path: '/api/sources',
        name: 'api.sources',
        verb: 'get'
    });
    // Return the script info
    return scriptInfo;
};
