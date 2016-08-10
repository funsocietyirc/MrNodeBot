// Static Routes and pages
'use strict';
module.exports = app => {
    // Register upload Handler
    app.WebRoutes.set('landingPage', {
        handler: (req,req) => {
            res.render('landing', {});
        },
        desc: 'Landing Page',
        path: '/',
        name: 'landingPage',
        verb: 'get'
    });
};
