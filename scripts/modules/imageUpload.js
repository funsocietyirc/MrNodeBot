// TODO make sure the file sizes are random using rand-token

'use strict';
const scriptInfo = {
    name: 'upload',
    file: 'upload.js',
    createdBy: 'Dave Richer'
};

const path = require('path');
const Models = require('bookshelf-model-loader');
const randToken = require('rand-token');
const tokenModel = Models.Token;

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Token) {
        return;
    }

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
        let token = req.body.token;
        let nsfw = req.body.nsfw || false;

        tokenModel
            .where('token', token)
            .fetch()
            .then(tResults => {
                if (!tResults) {
                    res.send('Invalid token');
                    return;
                }

                // Move the image to the uploads dir
                let fileName = `${randToken.generate(6)}${path.extname(file.name)}`;
                file.mv(app.AppRoot + '/uploads/' + fileName, err => {
                    // if something went wrong, return
                    if (err) {
                        res.send('Something went wrong with the image upload');
                        return;
                    }

                    // Add the Url to the database
                    if (Models.Url) {
                        let urlModel = Models.Url;
                        let urlPath = `${app.Config.express.address}/uploads/${fileName}`;
                        urlModel.create({
                                url: urlPath,
                                to: tResults.get('channel'),
                                from: tResults.get('user')
                            })
                            .then(() => {
                                let msg =  `${tResults.get('user')} just uploaded: ${urlPath}`;
                                if(nsfw) {
                                    msg = `${msg} (NSFW)`;
                                }
                                app.say(tResults.get('channel'),msg);
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
        let path = app.WebServer.namedRoutes.build('urls', {
            channel: to
        });
        app.say(to, `You can view all images from ${to} at ${ app.Config.express.address}${path}`);
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

    app.Commands.set('images', {
        desc: 'Show users the link to images',
        access: app.Config.accessLevels.identified,
        call: showImageLink
    });

    // Return the script info
    return scriptInfo;
};
