'use strict';

const scriptInfo = {
    name: 'youtubeLinkApi',
    desc: 'The YouTube link API',
    createdBy: 'IronY'
};
const Models = require('bookshelf-model-loader');
const _ = require('lodash');

module.exports = app => {
    // Hold on to the Model
    const model = Models.YouTubeLink;
    // No Model available, abort
    if(!model) return scriptInfo;

    // Get a list of channels available
    const getSourcesAvailableHandler = async (req, res) => {
        try {
            const results = await model.query(qb => qb.distinct('to').orderBy('to')).fetchAll();
            res.json({
                status: 'success',
                sources: results.pluck('to'),
                total: results.length
            });
        }
        catch (err) {
            res.json({
                status: 'error',
                message: err.message
            });
        }
    };

    app.WebRoutes.set('api.youtubelinks.sources', {
        handler: getSourcesAvailableHandler,
        desc: 'URL Link API',
        path: '/api/youtubelinks/sources',
        name: 'api.youtubelinks.sources',
        verb: 'get'
    });


    return scriptInfo;
};