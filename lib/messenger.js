const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('./logger');

const fbApiUrl = 'https://graph.facebook.com/v2.6/me/messages';

// https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start

// Helper function to see if Messenger is enabled
const isMessengerEnabled = (app) => !_.isUndefined(app) &&
        !_.isUndefined(app.WebServer) &&
        _.isFunction(app.WebServer.get) &&
        _.isFunction(app.WebServer.post) &&
        _.isObject(app.Config.features.messenger) &&
        _.isBoolean(app.Config.features.messenger.enabled) &&
        app.Config.features.messenger.enabled &&
        _.isString(app.Config.features.messenger.pageId) &&
        !_.isEmpty(app.Config.features.messenger.pageId) &&
        _.isString(app.Config.features.messenger.accessToken) &&
        !_.isEmpty(app.Config.features.messenger.accessToken) &&
        _.isString(app.Config.features.messenger.appId) &&
        !_.isEmpty(app.Config.features.messenger.appId) &&
        _.isString(app.Config.features.messenger.appSecret) &&
        !_.isEmpty(app.Config.features.messenger.appSecret) &&
        _.isString(app.Config.features.messenger.verifyToken) &&
        !_.isEmpty(app.Config.features.messenger.verifyToken);

const messenger = (app) => {
    // Add Messenger Routes if enabled
    if (!isMessengerEnabled(app)) {
        return;
    }

    /**
     * Call Facebook API
     * @param {String} senderPsid
     * @param {Object} response
     */
    const callSendAPI = (senderPsid, response) => {
        // Construct the message body
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            message: response,
        };

        // Send the HTTP request to the Messenger Platform
        rp({
            uri: fbApiUrl,
            qs: { access_token: app.Config.features.messenger.accessToken },
            method: 'POST',
            json: true,
            body: requestBody,
        });
    };

    /**
     * Text Message Handlers
     * @param {Object} receivedMessage
     */
    const textMessageHandler = (receivedMessage) => {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        const response = {
            text: `You sent the message: "${receivedMessage.text}". Now send me an attachment!`,
        };

        return response;
    };

    /**
     * Handle Multimedia Messages
     * @param {Object} receivedMessage
     */
    const multimediaMessageHandler = (receivedMessage) => {
        // Get the URL of the message attachment
        const attachmentUrl = receivedMessage.attachments[0].payload.url;
        const response = {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [{
                        title: 'Is this the right picture?',
                        subtitle: 'Tap a button to answer.',
                        image_url: attachmentUrl,
                        buttons: [
                            {
                                type: 'postback',
                                title: 'Yes!',
                                payload: 'yes',
                            },
                            {
                                type: 'postback',
                                title: 'No!',
                                payload: 'no',
                            },
                        ],
                    }],
                },
            },
        };

        return response;
    };

    /**
     *Handle FB Messenger Message
     * @param {String} senderPsid
     * @param {Object} receivedMessage
     */
    const handleMessage =
        (senderPsid, receivedMessage) => callSendAPI(
            senderPsid, receivedMessage.text ?
                textMessageHandler(receivedMessage) :
                multimediaMessageHandler(receivedMessage),
        );

    /**
     *
     * @param {String} senderPsid
     * @param {Object} receivedPostback
     */
    const handlePostback = (senderPsid, receivedPostback) => {
        console.log('ok');
        let response;
        // Get the payload for the postback
        const { payload } = receivedPostback;

        // Set the response based on the postback payload
        if (payload === 'yes') {
            response = { text: 'Thanks!' };
        } else if (payload === 'no') {
            response = { text: 'Oops, try sending another image.' };
        }
        // Send the message to acknowledge the postback
        callSendAPI(senderPsid, response);
    };

    /**
     * Handler Facebook Messenger Requests
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    const messengerPostHandler = async (req, res) => {
        // Parse the request body from the POST
        const { body } = req;

        if (body.object !== 'page') {
            // Return a '404 Not Found' if event is not from a page subscription
            return res.sendStatus(404);
        }

        body.entry.forEach((entry) => {
            // Gets the body of the webhook event
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            // Get the sender PSID
            const senderPsid = webhookEvent.sender.id;
            console.log(`Sender ID: ${senderPsid}`);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {
                handleMessage(senderPsid, webhookEvent.message);
            } else if (webhookEvent.postback) {
                handlePostback(senderPsid, webhookEvent.postback);
            }
        });

        // Return a '200 OK' response to all events
        return res.status(200).send('EVENT_RECEIVED');
    };

    /**
 * Facebook Messenger get Handler
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
    const messengerGetHandler = async (req, res) => {
        // Parse params from the webhook verification request
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Check if a token and mode were sent
        if (mode && token && (mode === 'subscribe' && token === app.Config.features.messenger.verifyToken)) {
            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            return res.status(200).send(challenge);
        }

        // Responds with '403 Forbidden' if verify tokens do not match
        return res.sendStatus(403);
    };

    logger.info('Facebook Messenger Routes Enabled');

    app.WebServer.get('/messenger', messengerGetHandler);
    app.WebServer.post('/messenger', messengerPostHandler);
};

module.exports = messenger;
