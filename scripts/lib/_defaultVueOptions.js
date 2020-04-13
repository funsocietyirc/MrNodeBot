const _ = require('lodash');

/**
 * Default Vue Options
 * @type {{head: {styles: [{style: string, type: string}, {style: string, type: string}], title: string, scripts: ({src: string}|{src: string}|{src: string}|{src: string}|{src: string})[]}}}
 * @private
 */
const _defaultVueOptions = {
    webpack: {
        client: {},
        server: {}
    },
    vue: {
        app: '1.0.0',
        client: '1.0.0',
        server: '1.0.0',
    },
    head: {
        title: 'MrNodeBot',
        metas: [
            { name: 'application-name', content: 'MrNodeBot' },
            { name: 'description', content: 'A Swiss Army Knife NodeJS IRC Bot Framework' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            }
        ],
        styles: [
            {style: '/assets/uikit-external.css', type: 'text/css'},
            {style: '/assets/app-external.css', type: 'text/css'},
        ],
        scripts: [
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/uikit.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/lightbox.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/notify.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/tooltip.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/grid.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/accordion.min.js'},
            {src: 'https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.5/js/components/sortable.min.js'},
        ]
    }
};

const getVueOptions = (config = {}) => _.defaultsDeep(config, _defaultVueOptions);

module.exports = getVueOptions;
