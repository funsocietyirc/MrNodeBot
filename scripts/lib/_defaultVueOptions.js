const _ = require('lodash');
const config = require('../../config');

/**
 * Get Mode
 * @returns {string}
 */
const getMode = () => config.bot.webDebug === true ? 'development' : 'production';
/**
 * Default Vue Options
 * @type {{head: {styles: [{style: string, type: string}, {style: string, type: string}], title: string, scripts: ({src: string}|{src: string}|{src: string}|{src: string}|{src: string})[]}}}
 * @private
 */
const _defaultVueOptions = {
    webpack: {
        client: {mode: getMode()},
        server: {mode: getMode()},
    },
    vue: {
        app: '1.0.0',
        client: '1.0.0',
        server: '1.0.0',
    },
    template: {
        html: {
            start: '<!DOCTYPE html><html>',
            end: '</html>'
        },
        body: {
            start: '<body>',
            end: '</body>'
        },
        template: {
            start: '<div id="app">',
            end: '</div>'
        }
    },
    head: {
        title: 'MrNodeBot',
        metas: [
            {name: 'application-name', content: 'MrNodeBot'},
            {name: 'description', content: 'A Swiss Army Knife NodeJS IRC Bot Framework'},
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            },
            {rel: 'icon', type: 'image/x-icon', href: '/assets/favicon.ico?v=1'}
        ],
        styles: [
            {style: '/assets/uikit-external.css', type: 'text/css'},
            {style: '/assets/app-external.css', type: 'text/css'},
        ],
        scripts: [
            {src: '/assets/external/socket.io.js'},
            {src: '/assets/external/uikit.min.js'},
            {src: '/assets/external/lightbox.min.js'},
            {src: '/assets/external/notify.min.js'},
            {src: '/assets/external/tooltip.min.js'},
            {src: '/assets/external/grid.min.js'},
            {src: '/assets/external/accordion.min.js'},
            {src: '/assets/external/sortable.min.js'},
        ]
    }
};

const getVueOptions = (config = {}) => _.defaultsDeep(config, _defaultVueOptions);

module.exports = getVueOptions;
