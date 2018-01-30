const scriptInfo = {
    name: 'GeneratePlaylist',
    desc: 'Generate a youtube playlist',
    createdBy: 'IronY',
};
const _ = require('lodash');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = (app) => {

    // Send Announcement Over IRC
    const generate = async (to, from, text, message) => {
        // No text provided
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
            app.say(to, `A nick is required for an announcement`);
            return;
        }

        try {
            // Fetch Results
            const dbResults = await Models
                .YouTubeLink
                .query(qb =>
                    qb
                        .where('from', 'like', text)
                        .distinct('url')
                ).fetchAll();

            // Format Results
            const jsonResults = _.map(dbResults.toJSON(), x => Object.assign({}, x, {
                videoId: x.url.match(helpers.YoutubeExpression)[2],
            }));

            console.dir(jsonResults);
        } catch (err) {
            logger.error('Something went wrong generating a playlist', {
                stack: err.stack,
                message: err.message,
            });
            app.say(to, `I am sorry ${from}, something went very very wrong`);
        }
    };


    // Handle IRC Command
    app.Commands.set('generate-youtube-playlist', {
        desc: '[nick] Broadcast announcement',
        access: app.Config.accessLevels.owner,
        call: generate,
    });

    return scriptInfo;
};
