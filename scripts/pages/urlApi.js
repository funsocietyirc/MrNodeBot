// Build the Base query.
// args:
//   req - express quest
//   callback
//
// query params:
//   type:
//     images -- will filter based on image file types
//   user -- matches user
//   channel -- matches channel
//
const scriptInfo = {
    name: 'urlApi',
    desc: 'The URL Express API',
    createdBy: 'IronY',
};
const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');

const hashPattern = new RegExp('%23', 'g');

module.exports = (app) => {
    // Bail out if we do not have a database
    if (!Models.Url) return scriptInfo;

    // Where clause to filter for images
    const whereClause = clause => clause
        .where('url', 'like', '%.jpeg')
        .orWhere('url', 'like', '%.jpg')
        .orWhere('url', 'like', '%.gif')
        .orWhere('url', 'like', '%.png');

    // Get the available sources.
    // Returns a unique list of combined nicks and channels
    const imageSourceHandler = async (req, res) => {
        try {
            const results = await Models.Url.query(qb => qb
                .select(['to', 'from', 'id', 'timestamp'])
                .where(whereClause)
                .orderBy('timestamp', 'desc'))
                .fetchAll();

            res.json({
                status: 'success',
                results: {
                    channels: _(results.pluck('to')).uniq().value(),
                    nicks: _(results.pluck('from')).uniq().value(),
                },
            });
        } catch (err) {
            res.json({
                status: 'error',
                message: err.message || '',
            });
        }
    };

    // Get list of available urls
    const urlHandler = async (req, res) => {
        try {
            const results = await Models.Url
                .query((qb) => {
                    let init = false;
                    const getWhere = () => (init ? 'andWhere' : 'where');

                    // Select the appropriate fields
                    qb.select([
                        'id', 'to', 'from', 'url', 'timestamp', 'title',
                    ]);

                    // If there is a channel in the query string
                    if (req.query.channel) {
                        qb.where('to', req.query.channel.replace(hashPattern, '#'));
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
                    qb.orderBy('timestamp', req.query.sort || 'desc');
                })
                .fetchPage({
                    pageSize: req.query.pageSize || 25,
                    page: req.query.page || 1,
                });

            res.json({
                rowCount: results.pagination.rowCount,
                pageCount: results.pagination.pageCount,
                page: results.pagination.page,
                pageSize: results.pagination.pageSize,
                status: 'success',
                results: results.toJSON(),
            });
        } catch (err) {
            res.json({
                status: 'error',
                message: err.message || '',
            });
        }
    };

    // Url Route
    app.WebRoutes.set('api.urls', {
        handler: urlHandler,
        desc: 'URL Link API',
        path: '/api/urls',
        verb: 'get',
    });

    // Sources Route
    app.WebRoutes.set('api.sources', {
        handler: imageSourceHandler,
        desc: 'Get the available sources',
        path: '/api/sources',
        verb: 'get',
    });

    // Return the script info
    return scriptInfo;
};
