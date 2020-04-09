const Models = require('funsociety-bookshelf-model-loader');

// Static Routes and pages
const scriptInfo = {
    name: 'Vue Pages',
    desc: 'Vue Pages',
    createdBy: 'IronY',
};

/**
 * Default Vue Configuration Object
 * @type {{head: {title: string, styles: *[], scripts: *[]}}}
 */
const defaultVueOptions = {
    head: {
        title: 'Channels',
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
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/accordion.min.js'}]
    }
};

module.exports = (app) => {
    // No backing table, bail
    if (!Models.Url) return scriptInfo;

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
        res.renderVue('watch.vue', data, req.vueOptions);
    };
    app.WebRoutes.set('watch', {
        handler: watch,
        desc: 'Watch',
        path: '/watch',
        verb: 'get',
    });

    /**
     *  Provide channel information
     * @param req
     * @param res
     * @param next
     */
    const channels = (req, res, next) => {
        const data = {};
        req.vueOptions = defaultVueOptions;
        res.renderVue('channelDash.vue', data, req.vueOptions);
    };

    app.WebRoutes.set('channels', {
        handler: channels,
        desc: 'Channels',
        path: '/channels',
        verb: 'get',
    });

    /**
     * Provide link information
     * @param req
     * @param res
     * @param next
     */
    const coronaLinks = (req, res, next) => {
        const data = {
            query: {
                channels: "#coronavirus,##coronavirus,##covid-19,##covid19-facts",
            }
        };
        req.vueOptions = defaultVueOptions;
        res.renderVue('links.vue', data, req.vueOptions);
    };

    /**
     * Provide link information
     * @param req
     * @param res
     * @param next
     */
    const links = (req, res, next) => {
        const data = {
            query: req.query
        };
        req.vueOptions = defaultVueOptions;
        res.renderVue('links.vue', data, req.vueOptions);
    };

    app.WebRoutes.set('links', {
        handler: links,
        desc: 'Links',
        path: '/links/:pageSize?',
        verb: 'get',
    });

    app.WebRoutes.set('coronalinks', {
        handler: coronaLinks,
        desc: 'Corona Virus Links',
        path: '/coronalinks/:pageSize?',
        verb: 'get',
    });

    /**
     * Provide link information
     * @param req
     * @param res
     * @param next
     */
    const logs = (req, res, next) => {
        const data = {
            params: req.params,
        };
        req.vueOptions = defaultVueOptions;
        res.renderVue('log.vue', data, req.vueOptions);
    };

    app.WebRoutes.set('logs', {
        handler: logs,
        desc: 'Logs',
        path: '/logs/:channel/:date/:page?',
        verb: 'get',
    });

    // Return the script info
    return scriptInfo;
};
