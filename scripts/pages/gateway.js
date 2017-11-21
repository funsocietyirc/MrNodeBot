// Static Routes and pages
const scriptInfo = {
    name: 'Gateway',
    desc: 'Experimental JWT Gateway',
    createdBy: 'IronY',
};

const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = (app) => {
    // Notification Gateway
    app.WebRoutes.set('gateway', {
        handler: (req, res) => {
            // An Admin account is needed
            if (!req.userInfo || !req.userInfo.admin) {
                return res.json({
                    success: false,
                    message: 'Not enough information to complete this request',
                });
            }

            // No Payload / recipient
            if (!req.body.payload || !req.body.recipient) {
                return res.json({
                    success: false,
                    message: 'Missing payload or recipient',
                });
            }

            // A Very basic message
            app.say(req.body.recipient, req.body.payload);

            // Log to database if table is available
            if (Models.GatewayLogging) {
                Models.GatewayLogging.create({
                    from: req.userInfo.nick,
                    to: req.body.recipient,
                    payload: req.body.payload,
                })
                    .catch(e => logger.error(`Error in logging gateway interface to database ${e.message}`));
            }

            // Send back all is ok
            return res.json({
                success: true,
                message: `Message delivery to ${req.body.recipient} attempted`,
            });
        },
        desc: 'Gateway',
        path: '/gateway',
        verb: 'post',
        secure: true,
    });

    // Return the script info
    return scriptInfo;
};
