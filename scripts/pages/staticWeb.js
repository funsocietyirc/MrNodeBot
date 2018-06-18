const Models = require('funsociety-bookshelf-model-loader');

// Static Routes and pages
const scriptInfo = {
    name: 'Static Pages',
    desc: 'Static Express Pages',
    createdBy: 'IronY',
};

module.exports = (app) => {
    // Landing Page
    app.WebRoutes.set('landingPage', {
        handler: (req, res) => res.render('landing', {}),
        desc: 'Landing Page',
        path: '/',
        verb: 'get',
    });

    // If url model is available
    if (Models.Url) {
        /**
         * Random Url
         * @param req
         * @param res
         * @return {Promise<void>}
         */
        const randomUrlHandler = async (req, res) => {
            const results = await Models
                .Url
                .query(qb =>
                    qb
                        .select(['url'])
                        .orderByRaw('rand()')
                        .limit(1)
                ).fetchAll();
            res.redirect(
                results.length  ? results.models[0].attributes.url : '/'
            );
        };
        app.WebRoutes.set('randomurl', {
            handler: randomUrlHandler,
            desc: 'Random URL',
            path: '/randomurl',
            verb: 'get',
        });
    }

    // Return the script info
    return scriptInfo;
};
