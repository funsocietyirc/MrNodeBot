// Static Routes and pages
'use strict';
const scriptInfo = {
    name: 'static',
    file: 'static.js',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    // Landing Page
    app.WebRoutes.set('landingPage', {
        handler: (req,res) => {
            let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            app.say(app.Config.owner.nick, `Landing page has been visited by: ${ip}`);
            res.render('landing', {});
        },
        desc: 'Landing Page',
        path: '/',
        name: 'landingPage',
        verb: 'get'
    });
    // Landing Page
    app.WebRoutes.set('chat', {
        handler: (req,res) => {
            res.render('chat', {});
        },
        desc: 'Chat',
        path: '/chat',
        name: 'chat',
        verb: 'get'
    });

    // Return the script info
    return scriptInfo;
};
