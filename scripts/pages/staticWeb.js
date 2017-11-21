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

    // Return the script info
    return scriptInfo;
};
