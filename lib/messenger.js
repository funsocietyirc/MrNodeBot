/* eslint-disable no-buffer-constructor */
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
    app.WebServer.get('/privacy', (req, res) => {
        res.set('Content-Type', 'text/html');
        res.send(new Buffer(`<html><body><h1>Privacy Policy</h1>
        <p>Last updated: August 16, 2020</p>
        <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
        <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the <a href="https://www.termsfeed.com/privacy-policy-generator/" target="_blank">Privacy Policy Generator</a>.</p>
        <h1>Interpretation and Definitions</h1>
        <h2>Interpretation</h2>
        <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
        <h2>Definitions</h2>
        <p>For the purposes of this Privacy Policy:</p>
        <ul>
        <li>
        <p><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</p>
        </li>
        <li>
        <p><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to MrNodeBot.</p>
        </li>
        <li>
        <p><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</p>
        </li>
        <li>
        <p><strong>Country</strong> refers to: Ontario,  Canada</p>
        </li>
        <li>
        <p><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</p>
        </li>
        <li>
        <p><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</p>
        </li>
        <li>
        <p><strong>Service</strong> refers to the Website.</p>
        </li>
        <li>
        <p><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</p>
        </li>
        <li>
        <p><strong>Third-party Social Media Service</strong> refers to any website or any social network website through which a User can log in or create an account to use the Service.</p>
        </li>
        <li>
        <p><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</p>
        </li>
        <li>
        <p><strong>Website</strong> refers to MrNodeBot, accessible from <a href="https://bot.fsociety.online/privpolicy" rel="external nofollow noopener" target="_blank">https://bot.fsociety.online/privpolicy</a></p>
        </li>
        <li>
        <p><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</p>
        </li>
        </ul>
        <h1>Collecting and Using Your Personal Data</h1>
        <h2>Types of Data Collected</h2>
        <h3>Personal Data</h3>
        <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p>
        <ul>
        <li>
        <p>Email address</p>
        </li>
        <li>
        <p>Usage Data</p>
        </li>
        </ul>
        <h3>Usage Data</h3>
        <p>Usage Data is collected automatically when using the Service.</p>
        <p>Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
        <p>When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.</p>
        <p>We may also collect information that Your browser sends whenever You visit our Service or when You access the Service by or through a mobile device.</p>
        <h3>Tracking Technologies and Cookies</h3>
        <p>We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service.</p>
        <p>You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service.</p>
        <p>Cookies can be &quot;Persistent&quot; or &quot;Session&quot; Cookies. Persistent Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close your web browser. Learn more about cookies: <a href="https://www.termsfeed.com/blog/cookies/" target="_blank">All About Cookies</a>.</p>
        <p>We use both session and persistent Cookies for the purposes set out below:</p>
        <ul>
        <li>
        <p><strong>Necessary / Essential Cookies</strong></p>
        <p>Type: Session Cookies</p>
        <p>Administered by: Us</p>
        <p>Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.</p>
        </li>
        <li>
        <p><strong>Cookies Policy / Notice Acceptance Cookies</strong></p>
        <p>Type: Persistent Cookies</p>
        <p>Administered by: Us</p>
        <p>Purpose: These Cookies identify if users have accepted the use of cookies on the Website.</p>
        </li>
        <li>
        <p><strong>Functionality Cookies</strong></p>
        <p>Type: Persistent Cookies</p>
        <p>Administered by: Us</p>
        <p>Purpose: These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.</p>
        </li>
        </ul>
        <p>For more information about the cookies we use and your choices regarding cookies, please visit our Cookies Policy or the Cookies section of our Privacy Policy.</p>
        <h2>Use of Your Personal Data</h2>
        <p>The Company may use Personal Data for the following purposes:</p>
        <ul>
        <li><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</li>
        <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</li>
        <li><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</li>
        <li><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</li>
        <li><strong>To provide You</strong> with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.</li>
        <li><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</li>
        </ul>
        <p>We may share your personal information in the following situations:</p>
        <ul>
        <li><strong>With Service Providers:</strong> We may share Your personal information with Service Providers to monitor and analyze the use of our Service,  to contact You.</li>
        <li><strong>For Business transfers:</strong> We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of our business to another company.</li>
        <li><strong>With Affiliates:</strong> We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.</li>
        <li><strong>With Business partners:</strong> We may share Your information with Our business partners to offer You certain products, services or promotions.</li>
        <li><strong>With other users:</strong> when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside. If You interact with other users or register through a Third-Party Social Media Service, Your contacts on the Third-Party Social Media Service may see Your name, profile, pictures and description of Your activity. Similarly, other users will be able to view descriptions of Your activity, communicate with You and view Your profile.</li>
        </ul>
        <h2>Retention of Your Personal Data</h2>
        <p>The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.</p>
        <p>The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.</p>
        <h2>Transfer of Your Personal Data</h2>
        <p>Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.</p>
        <p>Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.</p>
        <p>The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.</p>
        <h2>Disclosure of Your Personal Data</h2>
        <h3>Business Transactions</h3>
        <p>If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.</p>
        <h3>Law enforcement</h3>
        <p>Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).</p>
        <h3>Other legal requirements</h3>
        <p>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
        <ul>
        <li>Comply with a legal obligation</li>
        <li>Protect and defend the rights or property of the Company</li>
        <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
        <li>Protect the personal safety of Users of the Service or the public</li>
        <li>Protect against legal liability</li>
        </ul>
        <h2>Security of Your Personal Data</h2>
        <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>
        <h1>Your California Privacy Rights (California's Shine the Light law)</h1>
        <p>Under California Civil Code Section 1798 (California's Shine the Light law), California residents with an established business relationship with us can request information once a year about sharing their Personal Data with third parties for the third parties' direct marketing purposes.</p>
        <p>If you'd like to request more information under the California Shine the Light law, and if you are a California resident, You can contact Us using the contact information provided below.</p>
        <h1>California Privacy Rights for Minor Users (California Business and Professions Code Section 22581)</h1>
        <p>California Business and Professions Code section 22581 allow California residents under the age of 18 who are registered users of online sites, services or applications to request and obtain removal of content or information they have publicly posted.</p>
        <p>To request removal of such data, and if you are a California resident, You can contact Us using the contact information provided below, and include the email address associated with Your account.</p>
        <p>Be aware that Your request does not guarantee complete or comprehensive removal of content or information posted online and that the law may not permit or require removal in certain circumstances.</p>
        <h1>Links to Other Websites</h1>
        <p>Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.</p>
        <p>We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>
        <h1>Changes to this Privacy Policy</h1>
        <p>We may update our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p>
        <p>We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the &quot;Last updated&quot; date at the top of this Privacy Policy.</p>
        <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
        <h1>Contact Us</h1>
        <p>If you have any questions about this Privacy Policy, You can contact us:</p>
        <ul>
        <li>By email: dave@ir0ny.online</li>
        </ul></body></html>`));
    });
};

module.exports = messenger;
