/* eslint-disable function-paren-newline */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
const _ = require('lodash');
const rp = require('request-promise-native');
const statusCodeErrors = require('request-promise-native/errors');

const logger = require('./logger');
const extractUrls = require('./extractUrls');
const getShorten = require('../scripts/urlListener/_getShort'); // Shorten the URL
const startChain = require('../scripts/urlListener/_startChain'); // Start Chain
const processDocument = require('../scripts/urlListener/_processDocument'); // Process Document
const safeCheck = require('../scripts/urlListener/_googleSafeCheck'); // Safe Check
const matcher = require('../scripts/urlListener/_linkMatcher'); // Matcher
const sendToDb = require('../scripts/urlListener/_sendToDb');
const sendToSocket = require('../scripts/urlListener/_sendToSocket');
const sendToTwitter = require('../scripts/urlListener/_sendToTwitter');
const endChain = require('../scripts/urlListener/_endChain');

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

    // Fetch Max Length
    const maxLength = app.Config.features.urls.hasOwnProperty('maxLength') && _.isNumber(app.Config.features.urls.maxLength) ? app.Config.features.urls.maxLength : 10485760;

    // Fetch User Agent
    const userAgent = app.Config.features.urls.hasOwnProperty('userAgent') && _.isString(app.Config.features.urls.userAgent) ? app.Config.features.urls.userAgent : 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

    /**
     * Call Facebook API
     * @param {String} senderPsid
     * @param {Object} response
     */
    const callSendAPI = async (senderPsid, response) => {
        // Construct the message body
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            message: response,
        };

        try {
            // Send the HTTP request to the Messenger Platform
            await rp({
                uri: fbApiUrl,
                qs: { access_token: app.Config.features.messenger.accessToken },
                method: 'POST',
                json: true,
                body: requestBody,
            });
        } catch (err) {
            logger.error('Something went wrong sending a Facebook response', {
                stack: err.stack || '',
                message: err.message || '',
            });
        }
    };

    /**
     *  Process URLS
     * @param {Sting} url
     */
    const processUrl = (senderPsid, url) => {
        startChain(url, 'Facebook', senderPsid, url, {}, {}) // Begin Chain
            .then((results) => (results.cached ? results : // If we Have a cached object, continue in chain
                processDocument(results, userAgent, maxLength, _.isArray(app.Config.features.urls.headWhitelist) ? app.Config.features.urls.headWhitelist : []) // Make a request, verify the site exists, and grab metadata
                    .then(safeCheck)
                    .then((results) => (results.unreachable ? results : // If the site is not up, continue the chain
                        getShorten(results) // Otherwise grab the google SHORT Url
                            .then(() => matcher(results, app))), // Then send it to the regex matcher
                    )))
            .then((results) => results) // Send Results to IRC
            .then((results) => (results.unreachable ? results : // If the site is unreachable, carry on in chain
                sendToDb(results) // Otherwise Log To Database
                    .then((results) => sendToSocket(app, results)) // Then broadcast to socketio
                    .then((results) => sendToTwitter(app, results))))
            .then(endChain) // End the chain, cache results
            .catch((err) => {
                if (err instanceof statusCodeErrors.StatusCodeError) {
                    // Something went wrong
                    logger.warn('Error in URL Listener chain', {
                        err: err.message || '',
                        stack: err.stack || '',
                    });
                }
            });
    };

    /**
     * Text Message Handlers
     * @param {Object} receivedMessage
     */
    const textMessageHandler = (senderPsid, receivedMessage) => {
        // Url Processing chain
        const urls = _(extractUrls(receivedMessage.text))
            .uniq() // Assure No Duplicated URLS on the same line return multiple results
            .filter((url) => url.match(/^(www|http[s]?)/im)) // Filter out undesired protocols
            .map((url) => (url.toLowerCase().startsWith('http') ? url : `http://${url}`));

        urls.each((url) => processUrl(senderPsid, url));

        const response = {
            text: 'Your message has been received!',
        };

        return response;
    };

    /**
     * Handle Multimedia Messages
     * @param {Object} receivedMessage
     */
    const multimediaMessageHandler = (receivedMessage) => {
        console.dir(receivedMessage);

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
        async (senderPsid, receivedMessage) => callSendAPI(
            senderPsid, receivedMessage.text ?
                textMessageHandler(senderPsid, receivedMessage) :
                multimediaMessageHandler(receivedMessage),
        );

    /**
     *
     * @param {String} senderPsid
     * @param {Object} receivedPostback
     */
    const handlePostback = async (senderPsid, receivedPostback) => {
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
        await callSendAPI(senderPsid, response);
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
        console.dir(res);

        if (body.object !== 'page') {
            // Return a '404 Not Found' if event is not from a page subscription
            return res.sendStatus(404);
        }

        for (const entry of body.entry) {
            // Gets the body of the webhook event
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            // Get the sender PSID
            const senderPsid = webhookEvent.sender.id;
            console.log(`Sender ID: ${senderPsid}`);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {
                await handleMessage(senderPsid, webhookEvent.message);
            } else if (webhookEvent.postback) {
                await handlePostback(senderPsid, webhookEvent.postback);
            }
        }

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
        console.dir(req);
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
