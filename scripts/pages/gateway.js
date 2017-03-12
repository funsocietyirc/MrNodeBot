'use strict';
// Static Routes and pages
const scriptInfo = {
    name: 'Gateway',
    desc: 'Experimental JWT Gateway',
    createdBy: 'IronY'
};

module.exports = app => {
    // Landing Page
    app.WebRoutes.set('gateway', {
        handler: (req, res) => {
            // No Userinfo
            if (!req.userInfo)
                return res.json({
                    success: false,
                    message: 'No userInfo was provided'
                });
            // No Payload / recipient
            if (!req.body.payload || !req.body.recipient)
                return res.json({
                    success: false,
                    message: 'Missing payload or recipient'
                });

            // An Admin account is needed
            if(!req.userInfo.admin) {
              return res.json({
                success: false,
                message: 'You must be an Administrator to use this gateway'
              })
            }

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

    // Return the script info
    return scriptInfo;
};
