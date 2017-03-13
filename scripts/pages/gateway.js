'use strict';
// Static Routes and pages
const scriptInfo = {
    name: 'Gateway',
    desc: 'Experimental JWT Gateway',
    createdBy: 'IronY'
};

module.exports = app => {

    // Notification Gateway
    app.WebRoutes.set('gateway', {
        handler: (req, res) => {
            // An Admin account is needed
            if (!req.userInfo || !req.userInfo.admin) return res.json({
                success: false,
                message: 'Not enough information to complete this request'
            });

            // No Payload / recipient
            if (!req.body.payload || !req.body.recipient) return res.json({
                success: false,
                message: 'Missing payload or recipient'
            });

            // A Very basic message
            app.say(req.body.recipient, req.body.payload);

            // Send back all is ok
            return res.json({
                success: true,
                message: `Message delivery to ${req.body.recipient} attempted`
            })
        },
        desc: 'Gateway',
        path: '/gateway',
        name: 'landingPage',
        verb: 'post',
        secure: true
    });

    // General Logging Gateway
    app.WebRoutes.set('discordLogging', {
        handler: (req, res) => {
            // An Admin account is needed
            if (!req.userInfo) return res.json({
                success: false,
                message: 'Not enough information to complete this request'
            });

        },
        desc: 'Discord Logging',
        path: 'discordLogging',
        verb: 'post',
        secure: true
    });

    // Return the script info
    return scriptInfo;
};
