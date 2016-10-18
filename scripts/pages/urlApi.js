'use strict';

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

const scriptInfo = {
    name: 'urlApi',
    file: 'urlApi.js',
    desc: 'The URL Express API',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const _ = require('lodash');

module.exports = app => {
    // Bail out if we do not have a database
    if (!app.Database && Models.Url) {
        return;
    }

    // Where clause to filter for images
    const whereClause = clause => clause
        .where('url', 'like', '%.jpeg')
        .orWhere('url', 'like', '%.jpg')
        .orWhere('url', 'like', '%.gif')
        .orWhere('url', 'like', '%.png');

    /**
      Get the available sources.
      Returns a unique list of combined nicks and channels
    **/
    const imageSourceHandler = (req, res) => {
        Models.Url.query(qb => {
                qb
                    .select(['to', 'from', 'id', 'timestamp'])
                    .where(whereClause)
                    .orderBy('timestamp', 'desc');
            })
            .fetchAll()
            .then(results => {
                let channels = _(results.pluck('to')).uniq().value();
                let nicks = _(results.pluck('from')).uniq().value();
                res.json({
                    status: 'success',
                    results: {
                        channels,
                        nicks
                    }
                });
            });
    };

    /**
      Get list of available urls
    **/
    const urlHandler = (req, res) => {
        Models.Url.query(qb => {
                let init = false;
                let getWhere = () => init ? 'andWhere' : 'where';

                // Select the appropriate fields
                qb.select([
                    'id', 'to', 'from', 'url', 'timestamp', 'title'
                ]);

                // If there is a channel in the query string
                if (req.query.channel) {
                    qb.where('to', req.query.channel.replaceAll('%23', '#'));
                    init = true;
                }
                // If there is a from in the query string
                if (req.query.user) {
                    qb[getWhere()]('from', req.query.user);
                    init = true;
                }

                // Search for images only
                if (req.query.type) {
                    switch (req.query.type) {
                        case 'image':
                        case 'images':
                            qb[getWhere()](whereClause);
                            init = true;
                            break;
                        default:
                    }
                }

                // Build Up Query
                qb
                    .orderBy('timestamp', req.query.sort || 'desc');
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

    app.WebRoutes.set('api.sources', {
        handler: imageSourceHandler,
        desc: 'Get the available sources',
        path: '/api/sources',
        name: 'api.sources',
        verb: 'get'
    });
    // Return the script info
    return scriptInfo;
};
