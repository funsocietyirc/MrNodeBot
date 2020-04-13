const Models = require('funsociety-bookshelf-model-loader');

// Static Routes and pages
const scriptInfo = {
    name: 'Watch Vue Page',
    desc: 'Watch Vue Page',
    createdBy: 'IronY',
};
module.exports = app => {
    /**
     * Watch real time videos
     * @param req
     * @param res
     * @param next
     */
    const watch = (req, res, next) => {
        const data = {
            activeChannel: app.Config.features.fsociety.mainChannel,
        };
        req.vueOptions = {
            head: {
                title: 'Watch',
                styles: [
                    {style: '/assets/uikit-external.css', type: 'text/css'},
                    {style: '/assets/app-external.css', type: 'text/css'},
                ],
                scripts: [
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment-with-locales.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/uikit.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/lightbox.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/notify.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/tooltip.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/grid.min.js'},
                    {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/accordion.min.js'},
                    {src: 'https://cdn.jsdelivr.net/npm/vue-slider-component@2.7.2/dist/index.min.js'},
                    {src: 'https://cdn.jsdelivr.net/npm/vue-youtube-embed@2.1.3/lib/vue-youtube-embed.min.js'},
                ]
            }
        };
        res.renderVue('watch.vue', data, req.vueOptions({
            head: {
                title: 'Watch'
            }
        }));
    };
    app.webRoutes.associateRoute('watch', {
        handler: watch,
        desc: 'Watch',
        path: '/watch',
        verb: 'get',
        navEnabled: false,
        navPath: '/watch',
    });

    // Return the script info
    return scriptInfo;
};
