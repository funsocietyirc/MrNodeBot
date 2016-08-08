'use strict';
const _ = require('lodash');

// Display a list of images in the Web Front end
module.exports = app => {
    // Web Front End
    const images = (req, res) => {
        let urlModel = app.Models.get('url');
        new urlModel().query(qb => {
                // If there is a channel in the query string
                if (req.params.channel) {
                    qb.where('to', req.params.channel.replaceAll('%23', '#'));
                }
                // If there is a from in the query string
                if (req.params.user) {
                    qb.where('from', req.params.user);
                }

                // Build Up Query
                qb
                    .where(function() {
                        this
                            .where('url', 'like', '%.jpeg')
                            .orWhere('url', 'like', '%.jpg')
                            .orWhere('url', 'like', '%.gif')
                            .orWhere('url', 'like', '%.png');
                    })
                    .orderBy('timestamp', req.query.sort || 'desc')
                    .limit(req.query.length || 50);
            })
            .fetchAll()
            .then(results => {
                // Get Unique list of channels from results
                let channels = _.uniqBy(results.pluck('to'), c => c.toLowerCase());
                // Get Unique list of users from the results
                let users = _.uniqBy(results.pluck('from'), u => u.toLowerCase());
                res.render('images', {
                    results: results.toJSON(),
                    channels: channels,
                    users: users,
                    currentChannel: req.params.channel || false,
                    currentUser: req.params.user || false,
                    moment: require('moment')
                });
            });
    };

    // Register Route with Application
    if (app.Database && app.Models.has('url')) {
        app.WebRoutes.set('urls', {
            handler: images,
            desc: 'Image Front End',
            path: '/images/:channel?/:user?',
            name: 'urls'
        });
    }
};
