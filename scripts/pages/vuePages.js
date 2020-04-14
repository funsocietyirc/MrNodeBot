const Models = require('funsociety-bookshelf-model-loader');
const originText = require('../lib/_originText');

// Static Routes and pages
const scriptInfo = {
    name: 'Vue Pages',
    desc: 'Vue Pages',
    createdBy: 'IronY',
};

/**
 * Default Vue Configuration Object
 * @type {function(*=): any}
 */
const defaultVueOptions = require('../lib/_defaultVueOptions');

module.exports = app => {
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
    app.webRoutes.associateRoute('randomurl', {
        handler: randomUrlHandler,
        desc: 'Random URL',
        path: '/randomurl',
        verb: 'get',
        navEnabled: false,
        navPath: '/randomurl'
    });

    /**
     *  Provide channel information
     * @param req
     * @param res
     */
    const channels = (req, res) => {
        const data = {};
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Channels',
            }
        });

        res.renderVue('channelDash.vue', data, req.vueOptions);
    };

    app.webRoutes.associateRoute('channels', {
        handler: channels,
        desc: 'Channels',
        path: '/channels',
        verb: 'get',
        navEnabled: true,
        navPath: '/channels',
    });

    /**
     * Provide link information
     * @param req
     * @param res
     * @param next
     */
    const coronaLinks = (req, res) => {
        const data = {
            query: {
                channels: "#coronavirus,##coronavirus,##covid-19,##covid19-facts",
            }
        };
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Corona Links',
            }
        });
        res.renderVue('links.vue', data, req.vueOptions);
    };

    /**
     * Provide link information
     * @param req
     * @param res
     */
    const links = (req, res) => {
        const data = {
            query: req.query
        };
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Links',
            }
        });
        res.renderVue('links.vue', data, req.vueOptions);
    };

    app.webRoutes.associateRoute('links', {
        handler: links,
        desc: 'Links',
        path: '/links/:pageSize?',
        verb: 'get',
        navEnabled: true,
        navPath: '/links/',
    });

    app.webRoutes.associateRoute('coronalinks', {
        handler: coronaLinks,
        desc: 'Corona Virus Links',
        path: '/coronalinks/:pageSize?',
        verb: 'get',
    });

    /**
     * Provide link information
     * @param req
     * @param res
     */
    const logs = (req, res) => {
        const data = {
            params: req.params,
        };
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Logs',
            }
        });
        res.renderVue('log.vue', data, req.vueOptions);
    };

    app.webRoutes.associateRoute('logs', {
        handler: logs,
        desc: 'Logs',
        path: '/logs/:channel/:date/:page?',
        verb: 'get',
    });

    /**
     * Landing Page
     * @param req
     * @param res
     */
    const landing = (req, res) => {
        const data = {
            originText: originText(app),
        };
        req.vueOptions = defaultVueOptions({
            head: {
                title: 'Home',
            }
        });
        res.renderVue('landing.vue', data, req.vueOptions);
    };
    app.webRoutes.associateRoute('landingPage', {
        handler: landing,
        desc: 'Home',
        path: '/',
        verb: 'get',
        navEnabled: true,
        navPath: '/',
        navWeight: 0,
    });


    // Return the script info
    return scriptInfo;
};
