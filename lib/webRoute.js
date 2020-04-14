const _ = require('lodash');
const webRouteMap = new Map();

/**
 * Web Routes Module
 * @param app
 * @returns {{associateRoute: associateRoute, loadWebRoutes: loadWebRoutes, navLinks: (function(): Object[])}}
 */
const webRoutes = (app) => {
    /**
     *
     * @param {string} name
     * @param {Object} options
     * @returns {{name: string, options: (Object&{verb: string})}}
     * @private
     */
    const _validateRoute = (name = '', options = {}) => {
        // No Route Name
        if (!_.isString(name) || _.isEmpty(name)) {
            throw new Error('Invalid Route Name');
        }
        // Duplicate Route Name
        if (webRouteMap.has(name)) {
            throw new Error(`Route: ${name}, already exists`);
        }
        // Invalid Options Gate
        if (!_.isObject(options) || _.isEmpty(options)) {
            throw new Error('Invalid or empty Object');
        }
        /**
         *
         * @type {Object & {verb: string}}
         */
        const filteredOptions = _.clone(options);

        // Associate Name
        filteredOptions.name = name;

        if (!filteredOptions.verb) {
            filteredOptions.verb = 'get';
        }

        // Initial Check
        if (
            !_.isString(filteredOptions.desc) || _.isEmpty(filteredOptions.desc) ||
            !_.isFunction(filteredOptions.handler) ||
            !_.isString(filteredOptions.path) || _.isEmpty(filteredOptions.path)
        ) {
            throw new Error('Invalid Route Options Object');
        }
        // Nav check
        if (
            filteredOptions.hasOwnProperty('navEnabled')
        ) {
            if (!_.isBoolean(filteredOptions.navEnabled)) {
                throw new Error('navEnabled must be a boolean')
            }
            filteredOptions.navWeight = _.isNumber(filteredOptions.navWeight) ? filteredOptions.navWeight : -1;
            filteredOptions.navPath = _.isString(filteredOptions.navPath) && !_.isEmpty(filteredOptions.navPath) ? filteredOptions.navPath : filteredOptions.path;
        } else {
            filteredOptions.navEnabled = false;
            filteredOptions.navWeight = -1;
        }

        return {
            name: name,
            options: filteredOptions
        };
    };

    /**
     * Register Web Routes with the application
     */
    const loadWebRoutes = () => {
        webRouteMap.forEach((route, name) => {
            // We have a secure route, add it to the proper namespace
            if (_.isBoolean(route.secure) && route.secure) {
                // Remove any leading /
                if (_.startsWith(route.path, '/')) route.path = route.path.substring(1);
                route.path = `/secure/${route.path}`;
            }
            // Dynamically register the WebRoutes objects with express
            app.WebServer[route.verb || 'get'](route.path, name, route.handler);
        });
    };

    /**
     * Validate and associate a route object
     * @param {string} name
     * @param {Object} options
     */
    const associateRoute = (name = '', options = {}) => {
        const filteredResults = _validateRoute(name, options);
        // Register upload Handler
        webRouteMap.set(filteredResults.name, filteredResults.options);
    };

    /**
     * Generate Nav Links
     * @returns {Object[]}
     */
    const navLinks = () => [...webRouteMap]
        // Select only tagged routes
        .filter(x =>
            !x[0].startsWith('api') && x[1].navEnabled && x[1].navPath && x[1].desc && x[1].verb === 'get'
        )
        // Extract Results Object
        .map(x => Object.assign({}, x[1], {
            name: x[0],
        }))
        // Append Changes
        .map(x => Object.assign({}, x, {
            // Assign Formatted Nav Path
            navPath: `${app.Config.express.address}${x.navPath}`,
            navWeight: _.isNumber(parseInt(x.navWeight)) ? x.navWeight : -1
        }))
        // Sort Results by navWeight, no navWeight getting a -1
        .sort((x, y) => {
            if (x.navWeight > y.navWeight) {
                return -1;
            } else if (x.navWeight > y.navWeight) {
                return 1;
            }
            return 0;
        });

    /**
     * Clear Web Routes
     */
    const clearRoutes = () => webRouteMap.clear();

    /**
     * Has Route
     * @param name
     * @returns {boolean}
     */
    const hasRoute = name => webRouteMap.has(name);

    // Module Returns
    return {
        associateRoute,
        hasRoute,
        loadWebRoutes,
        navLinks,
        clearRoutes,
    }
};

module.exports = webRoutes;
