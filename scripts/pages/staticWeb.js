// Static Routes and pages
'use strict';
const scriptInfo = {
    name: 'Static Pages',
    desc: 'Static Express Pages',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    // Landing Page
    app.WebRoutes.set('landingPage', {
        handler: (req,res) => res.render('landing', {}),
        desc: 'Landing Page',
        path: '/',
        name: 'landingPage',
        verb: 'get'
    });
    // Landing Page
    app.WebRoutes.set('chat', {
        handler: (req,res) => res.render('chat', {}),
        desc: 'Chat',
        path: '/chat',
        name: 'chat',
        verb: 'get'
    });

    // Return the script info
    return scriptInfo;
};
