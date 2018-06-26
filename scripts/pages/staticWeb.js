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
                results.length ? results.models[0].attributes.url : '/'
            );
        };
        app.WebRoutes.set('randomurl', {
            handler: randomUrlHandler,
            desc: 'Random URL',
            path: '/randomurl',
            verb: 'get',
        });


        app.WebRoutes.set('links', {
            handler: (req, res, next) => {
                const data = {};

                req.vueOptions = {
                    head: {
                        title: 'Links',
                        styles: [
                            {style: '/assets/uikit-external.css', type: 'text/css'},
                            {style: '/assets/app-external.css', type: 'text/css'},
                        ],
                        scripts: [
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/uikit.min.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/lightbox.min.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/notify.min.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/tooltip.min.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/grid.min.js'},
                            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/accordion.min.js'}]
                    }
                };
                res.renderVue('links.vue', data, req.vueOptions);
            },
            desc: 'Links',
            path: '/links',
            verb: 'get',
        });
    }

    // Return the script info
    return scriptInfo;
};
