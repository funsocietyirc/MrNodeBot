const scriptInfo = {
    name: 'GeneratePlaylist',
    desc: 'Generate a youtube playlist',
    createdBy: 'IronY',
};
const _ = require('lodash');
const helpers = require('../../helpers');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

const initialLink = 'http://www.youtube.com/watch_videos?video_ids=';
const short = require('../lib/_getShortService')();

module.exports = (app) => {

    // Send Announcement Over IRC
    const generate = async (to, from, text, message) => {
        // No text provided
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
            app.say(to, `A nick is required for an announcement`);
            return;
        }
        const textArr = text.split();

        try {
            // Fetch Results
            const dbResults = await Models
                .YouTubeLink
                .query(qb =>
                    qb
                        .whereIn('from', textArr)
                        .distinct('url')
                        .orderBy('timestamp', 'desc')
                        .limit(25)
                ).fetchAll();

            // Format Results
            const ids = _.map(dbResults.toJSON(), x => {
                const match =  x.url.match(helpers.YoutubeExpression);
                return (!match || !match[2]) ? null : match[2];
            }).filter(x => x);
            const url = `${initialLink}${ids.join(',')}`;
            const shortUrl = await short(url);
            app.say(to, shortUrl)
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
