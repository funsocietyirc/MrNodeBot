// Static Routes and pages
'use strict';
module.exports = app => {
    // Register upload Handler
    app.WebRoutes.set('landingPage', {
        handler: (req,res) => {
            let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log(`Landing page has been visited by: ${ip}` )
            res.render('landing', {});
        },
        desc: 'Landing Page',
        path: '/',
        name: 'landingPage',
        verb: 'get'
    });
};
