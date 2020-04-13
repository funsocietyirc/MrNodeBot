// Static Routes and pages
const scriptInfo = {
    name: 'Gateway',
    desc: 'Experimental JWT Gateway',
    createdBy: 'IronY',
};

const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = app => {

    const gatewayHandler = (req, res) => {
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

        // Check if recipient is a channel, then check if we are in that channel
        if (app._ircClient.isChannel(req.body.recipient) && !app._ircClient.isInChannel(req.body.recipient)) {
            return res.json({
                success: false,
                message: `I am currently not able to send messages to the channel ${req.body.recipient}`
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
    };

    // Notification Gateway
    app.webRoutes.associateRoute('gateway', {
        handler: gatewayHandler,
        desc: 'Gateway',
        path: '/gateway',
        verb: 'post',
        secure: true,
    });

    // Return the script info
    return scriptInfo;
};
