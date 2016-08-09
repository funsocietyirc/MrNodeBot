// TODO make sure the file sizes are random using rand-token

'use strict';

const path = require('path');
const randToken = require('rand-token');

module.exports = app => {
    // Register a user to a token
    const registerToken = (to, from, text, message) => {
        // Only accept messages from channel
        if (to === from) {
            app.Bot.say(to, 'You must be in a channel to request a token');
            return;
        }

        let model = app.Models.get('token');
        let token = randToken.generate(8);

        new model()
            .query(qb => {
                qb
                    .where('user', from)
                    .where('channel', to);
            })
            .fetch()
            .then(result => {
                // If no previous tokens exist
                if (!result) {
                    new model({
                            user: from,
                            channel: to,
                            token: token
                        })
                        .save()
                        .then(() => {
                            app.Bot.say(from, `Your new token for ${to} is ${token}`);
                        });
                }
                // If previous token exists
                else {
                    new model()
                        .where({
                            user: from,
                            channel: to
                        })
                        .save({
                            token: token
                        }, {
                            patch: true
                        })
                        .then(() => {
                            app.Bot.say(from, `Your new token for ${to} is ${token}`);
                        });
                }
            });
    };

    // Show the form upload
    const uploadForm = (req, res) => {
        res.render('upload');
    };

    // Process the upload
    const uploadHandler = (req, res) => {
        // Validation
        if (!req.files || !req.body.token || !req.files.image.mimetype.startsWith('image/')) {
            res.send('Something went wrong with your request');
            return;
        }

        let file = req.files.image;
        let model = app.Models.get('token');
        let token = req.body.token;

        new model()
            .where('token', token)
            .fetch()
            .then(tResults => {
                if (!tResults) {
                    res.send('Invalid token');
                    return;
                }

                // Move the image to the uploads dir
                let fileName = `${randToken.generate(6)}${path.extname(file.name)}`;

                file.mv(app.AppRoot + '/uploads/', err => {
                    // if something went wrong, return
                    if (err) {
                        res.send('Something went wrong with the image upload');
                        return;
                    }

                    // Add the Url to the database
                    if (app.Models.has('url')) {
                        let url = app.Models.get('url');
                        let urlPath = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
                        new url({
                                url: urlPath,
                                to: tResults.get('channel'),
                                from: tResults.get('user'),
                            })
                            .save()
                            .then(() => {
                                app.Bot.say(tResults.get('channel'), `${tResults.get('user')} just uploaded: ${urlPath}`);
                            });
                    }

                    res.redirect(app.WebServer.namedRoutes.build('urls', {
                        channel: tResults.get('channel'),
                        user: tResults.get('user')
                    }));
                });
            });
    };

    const showImageLink = (to, from, text, message) => {
        // TODO Add host
        let path = app.WebServer.namedRoutes.build('urls', {
            channel: to
        });
        app.Bot.say(to, `You can view all images from ${to} at ${path}`);
    };

    // Register upload Form
    app.WebRoutes.set('uploadForm', {
        handler: uploadForm,
        desc: 'Upload a file',
        path: '/upload',
        name: 'upload',
        verb: 'get'
    });

    // Register upload Handler
    app.WebRoutes.set('uploadHandler', {
        handler: uploadHandler,
        desc: 'Handle File Upload',
        path: '/upload',
        name: 'upload',
        verb: 'post'
    });

    // Register token
    app.Commands.set('upload-token', {
        desc: 'Get a unique token for uploading images to file',
        access: app.Config.accessLevels.identified,
        call: registerToken
    });

    app.Commands.set('images', {
        desc: 'Show users the link to images',
        access: app.Config.accessLevels.identified,
        call: showImageLink
    });

};
