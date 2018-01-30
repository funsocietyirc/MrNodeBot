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

    const mashup = async (to, from, text, message) => {
        // No text provided
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
            app.say(to, `A nick or nicks are required to generate a YouTube mashup`);
            return;
        }
        try {
            const textArr = _.sampleSize(_.uniq(text.split(' ')), 2);

            tracks = [];
            for (const dj of textArr) {
                // Fetch Results
                const dbResults = await Models
                    .YouTubeLink
                    .query(qb =>
                        qb
                            .where('from', 'like', dj)
                            .select(['from', 'url', 'timestamp'])
                            .orderByRaw('rand()')
                            .limit(100)
                    ).fetchAll();

                // Format Results
                tracks.push(_.map(_.uniqBy(dbResults.toJSON(), 'url'), x => {
                    const match = x.url.match(helpers.YoutubeExpression);
                    return (!match || !match[2]) ? null : match[2];
                }).filter(x => x));
            }

            const finalTracks = _(tracks)
                .flattenDeep()
                .shuffle()
                .sampleSize(25)
                .value();

            const shortUrl = await short(`${initialLink}${finalTracks.join(',')}`);

            app.say(to, `A'yoh Hommie ${from.substr(0, 1).toUpperCase()}, check out ${finalTracks.length > 1 ? 'these' : 'this'} ${finalTracks.length} sick ${finalTracks.length > 1 ? 'tracks' : 'track'} by my peeps ${textArr.join(', ')}: ${shortUrl}`);
        } catch (err) {
            logger.error('Something went wrong creating a mashup', {
                stack: err.stack,
                message: err.message,
            });
            app.say(to, `I am sorry ${from}, something went very very wrong`);
        }
    };

    // Send Announcement Over IRC
    const generate = async (to, from, text, message) => {
        // No text provided
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
            app.say(to, `A nick or nicks are required to generate a YouTube playlist`);
            return;
        }
        const textArr = _.uniq(text.split(' '));

        try {
            // Fetch Results
            const dbResults = await Models
                .YouTubeLink
                .query(qb =>
                    qb
                        .whereIn('from', textArr)
                        .select(['from', 'url', 'timestamp'])
                        .distinct('url')
                        .orderBy('timestamp', 'desc')
                        .limit(25)
                ).fetchAll();

            // Format Results
            const ids = _.map(dbResults.toJSON(), x => {
                const match = x.url.match(helpers.YoutubeExpression);
                return (!match || !match[2]) ? null : match[2];
            }).filter(x => x);
            const shortUrl = await short(`${initialLink}${ids.join(',')}`);
            app.say(to, `A'yoh Hommie ${from.substr(0, 1).toUpperCase()}, check out ${ids.length > 1 ? 'these' : 'this'} ${ids.length} sick ${ids.length > 1 ? 'tracks' : 'track'} by my peeps ${textArr.join(', ')}: ${shortUrl}`);
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
        desc: '[nick1] [nick2?] [...] Generate a playlist with the last 25 results',
        access: app.Config.accessLevels.admin,
        call: generate,
    });
    app.Commands.set('generate-youtube-mashup', {
        desc: '[nick1] [nick2?] [...] Generate a mashup youtube playlist (3 nicks max)',
        access: app.Config.accessLevels.admin,
        call: mashup,
    });

    // No SocketIO detected, or feature is disabled
    if (app.WebServer.socketIO && !_.isEmpty(app.Config.features.watchYoutube) && app.Config.features.watchYoutube) {
        app.Commands.set('tv-watch-seed', {
            desc: '[nick1] [nick2?] [...] Generate a mashup youtube playlist (3 nicks max)',
            access: app.Config.accessLevels.admin,
            call: async (to, from, text, message) => {
                const activeChannelFormat = chanName => (chanName !== null ?
                    `/${chanName.toLowerCase()}` :
                    '/');
                // No text provided
                if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) {
                    app.say(to, `A nick or nicks are required to seed the tv station`);
                    return;
                }
                try {
                    const textArr = _.sampleSize(_.uniq(text.split(' ')), 2);
                    tracks = [];
                    for (const dj of textArr) {
                        // Fetch Results
                        const dbResults = await Models
                            .YouTubeLink
                            .query(qb =>
                                qb
                                    .where('from', 'like', dj)
                                    .select(['from', 'to', 'url', 'timestamp', 'title'])
                                    .orderByRaw('rand()')
                                    .limit(100)
                            ).fetchAll();

                        // Format Results
                        tracks.push(_.map(_.uniqBy(dbResults.toJSON(), 'url'), x => {
                            const match = x.url.match(helpers.YoutubeExpression);
                            return (!match || !match[2]) ? null : Object.assign({}, x, {
                                videoId: match[2]
                            });
                        }).filter(x => x));
                    }

                    _(tracks)
                        .flattenDeep()
                        .shuffle()
                        .sampleSize(5)
                        .each(x => {
                            // Send to socket
                            app.WebServer.socketIO.of('/youtube').to(activeChannelFormat(to)).emit('message', Object.assign({}, {
                                to,
                                from: x.from,
                                timestamp: Date.now(),
                                seekTime: 0,
                                video: {
                                    videoTitle: x.title,
                                    key: x.videoId,
                                },
                            }));
                        });

                }
                catch (err) {
                    logger.error('Something went wrong seeding the tv station', {
                        stack: err.stack,
                        message: err.message,
                    });
                    app.say(to, `I am sorry ${from}, something went very very wrong`);
                }
            },
        });
    }


    return scriptInfo;
};
