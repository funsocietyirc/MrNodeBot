// Static Routes and pages
const scriptInfo = {
    name: 'Static Pages',
    desc: 'Static Express Pages',
    createdBy: 'IronY',
};

module.exports = (app) => {
    // Landing Page
    app.webRoutes.associateRoute('landingPage', {
        handler: (req, res) => res.render('landing', {}),
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
