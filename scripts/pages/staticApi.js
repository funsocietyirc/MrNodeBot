const _ = require('lodash');

// Static Routes and pages
const scriptInfo = {
    name: 'Static API Pages',
    desc: 'Static API Pages',
    createdBy: 'IronY',
};

module.exports = (app) => {

    /**
     * Generate a list of pages for nav
     * @param req
     * @param res
     * @returns {*}
     */
    const pages = (req, res) => {
        try {
            return res.json({
                status: 'success',
                results: app.webRoutes.navLinks()
            });
        } catch (err) {
            return res.json({
                status: 'error',
                message: 'Something went wrong fetching Pages API data',
                results: []
            });
        }
    };

    app.webRoutes.associateRoute('api.pages', {
        handler: pages,
        desc: 'available pages api',
        path: '/api/pages',
        verb: 'get',
    });

    // Return the script info
    return scriptInfo;
};
