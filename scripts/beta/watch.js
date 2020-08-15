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
                    {src: '/assets/external/moment-with-locales.min.js'},
                    {src: '/assets/external/socket.io.js'},
                    {src: '/assets/external/uikit.min.js'},
                    {src: '/assets/external/lightbox.min.js'},
                    {src: '/assets/external/notify.min.js'},
                    {src: '/assets/external/tooltip.min.js'},
                    {src: '/assets/external/grid.min.js'},
                    {src: '/assets/external/accordion.min.js'},
                    {src: '/assets/external/vue-ui-slider.js'},
                    {src: '/assets/external/vue-youtube-embed.min.js'},
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
