const c = require('irc-colors');
const _ = require('lodash');
const config = require('../../config.js');
const helpers = require('../../helpers');
const moment = require('moment');
const ircTypography = require('../lib/_ircTypography');

const logos = ircTypography.logos;
const icons = ircTypography.icons;

// Formatting Helper
formattingHelper = (results, app) => {
    // Site is not live
    if (results.unreachable) {
        // Do not post unverified links
        if (_.isArray(app.Config.features.urls.unverifiedIgnore) && app.Config.features.urls.unverifiedIgnore.includes(results.from)) return;

        app.say(results.to, `${c[results.cached ? 'green' : 'red']('*')} ${results.from} ${icons.sideArrow} ${c.blue(results.url)} ${icons.sideArrow} ${c.red.bold('Unverifiable Link')} Code: ${results.statusCode || 'None'}`);
        return;
    }

    // Output chain helper functions
    let output = '';
    const space = () => (output !== '' ? ` ${icons.sideArrow} ` : ' ');
    const append = (text) => {
        output = output + space() + text;
        return append;
    };

    // This is a re post
    if (results.history.length) {
        const history = _.first(results.history);
        let subOutput = '';
        if (history.from !== results.from) {
            subOutput += history.from;
        }
        if (history.to !== results.to) {
            subOutput = subOutput + (history.from !== results.from ? '/' : '') + history.to;
        }
        if (!_.isEmpty(subOutput)) {
            append(subOutput);
        }
    }

    // Print real URL
    if (results.realUrl && results.url !== results.realUrl && results.realUrl.length < 160) append(`${icons.anchor}  ${c.navy(results.realUrl)}`);
    else if (results.realUrl && results.url !== results.realUrl) append(`${icons.anchor}  ${c.red('URL Redirected')}`);

    // We have a Short URL
    if (!_.isEmpty(results.shortUrl) && !_.isEmpty(results.shortUrl) && results.url.length > config.features.urls.titleMin) { append(`${icons.anchor}  ${c.navy(results.shortUrl)}`); }

    // We have a YouTube video response
    if (!_.isEmpty(results.youTube)) {
        // Append Logo
        append(logos.youTube);

        // We have playlist data
        if (!_.isEmpty(results.youTube.playlist)) {
            // Playlist has a title
            if (!_.isUndefined(results.youTube.playlist.playlistTitle) &&
                !_.isEmpty(results.youTube.playlist.playlistTitle)
            ) append(`Playlist: ${results.youTube.playlist.playlistTitle}`);
            // We have video count
            if (!_.isUndefined(results.youTube.playlist.videoCount)) append(`${results.youTube.playlist.videoCount} videos`);
        }

        // We have video data
        if (!_.isEmpty(results.youTube.video)) {
            const yr = results.youTube.video;
            if (!_.isEmpty(yr.channelTitle)) append(yr.channelTitle);
            append(yr.videoTitle)(`${icons.views} ${c.navy(helpers.formatNumber(yr.viewCount))} ${icons.upArrow} ${c.green(helpers.formatNumber(yr.likeCount))} ${icons.downArrow} ${c.red(helpers.formatNumber(yr.dislikeCount))} ${icons.comments} ${c.blue(helpers.formatNumber(yr.commentCount))}`);

            // Video is non embeddable
            if (!results.youTube.video.embeddable) append(`${c.red('*')} Non-embeddable`);
            // Video has content restrictions
            if (results.youTube.video.restrictions) append(`${c.red('*')} Content Restrictions`);
        }
    }

    // We have IMDB data
    else if (!_.isEmpty(results.imdb)) {
        const imdb = results.imdb;
        append(logos.imdb)(imdb.title)(imdb.year)(imdb.genre)(_.capitalize(imdb.type));
        if (imdb.seasons) append(`${c.bold('Seasons:')} ${imdb.seasons}`);
        if (imdb.rated) append(`${c.bold('Rated:')} ${imdb.rated}`);
        if (imdb.metaScore && imdb.metaScore !== 'N/A') append(`${c.bold('MetaScore:')} ${imdb.metaScore}`);

        append(c[imdb.imdbRating < 5 ? 'red' : 'green'](`Rating: ${imdb.imdbRating}`))(`${icons.views} ${c.navy(imdb.imdbVotes)}`);
    }
    // We Have GitHub data
    else if (!_.isUndefined(results.gitHub)) {
        const gh = results.gitHub;
        append(logos.gitHub)(gh.owner)(gh.name);
        if (gh.desc) append(gh.desc);
        if (gh.lastPush) append(`${icons.time} ${c.grey.bold('~')} ${moment(gh.lastPush).fromNow()}`);
        if (gh.isFork) append('Forked');
        if (gh.language) append(gh.language);
        if (gh.stars) append(`${icons.star} ${c.yellow(helpers.formatNumber(gh.stars))}`);
        if (gh.views && gh.views !== gh.stars) append(`${icons.views} ${c.navy(helpers.formatNumber(gh.watchers))}`);
        if (gh.forks) append(`${c.bold('Forks:')} ${helpers.formatNumber(gh.forks)}`);
        if (gh.issues) append(`${icons.sad} ${c.red(helpers.formatNumber(gh.issues))}`);
    }
    // We Have BitBucket data
    else if (!_.isUndefined(results.bitBucket)) {
        const bb = results.bitBucket;
        append(`${logos.bitBucket}`);
        if (!bb.privateRepo) {
            append(`${bb.ownerDisplayName} ${icons.sideArrow} ${bb.desc ? bb.desc : 'BitBucket Repository'}`)(`${icons.time} ${c.grey.bold('~')} ${moment(bb.lastPush).fromNow()}`);

            if (bb.language) append(bb.language);
            if (bb.hasIssues) append(icons.sad);
        } else {
            append('Private Repository, Access Denied');
        }
    }
    // We have Imgur image
    else if (!_.isUndefined(results.imgur) && results.imgur.matchType === 'image') {
        const imgur = results.imgur;
        append(`${logos.imgur} Image`);
        if (imgur.title && imgur.title !== 'null') append(imgur.title);
        append(_.capitalize(imgur.type))(moment.unix(imgur.datetime).fromNow());
        if (imgur.section && imgur.section !== 'null') append(imgur.section);
        if (imgur.description && imgur.description !== 'null') append(imgur.description);
        append(`${imgur.width}x${imgur.height}`);
        if (imgur.animated) append('Animated');
        if (imgur.nswf) append(c.red('NSFW'));
        append(`${icons.views} ${c.navy(helpers.formatNumber(imgur.views))}`);
    }
    // We have Imgur Gallery
    else if (!_.isUndefined(results.imgur) && results.imgur.matchType === 'gallery') {
        const imgur = results.imgur;
        append(`${logos.imgur} Gallery`)(imgur.account_url);
        if (imgur.title && imgur.title !== 'null') append(imgur.title);
        append(moment.unix(imgur.datetime).fromNow());
        if (imgur.description && imgur.description !== null) append(imgur.description);
        if (imgur.topic && imgur.topic !== 'null') append(imgur.topic);
        if (imgur.section && imgur.section !== 'null') append(imgur.section);

        append(`${imgur.images_count || 1} ${imgur.images_count > 1 ? 'Images' : 'Image'}`);

        append(`${icons.views} ${c.navy(helpers.formatNumber(imgur.views))}`)(`${icons.happy} ${c.green(helpers.formatNumber(imgur.ups))}`)(`${icons.sad} ${c.red(helpers.formatNumber(imgur.downs))}`)(`${icons.star} ${c.yellow(imgur.score)}`)(`${icons.comments} ${imgur.comment_count}`);
        if (imgur.nswf) append(c.red('NSFW'));
    }
    // We have Imgur Album
    else if (!_.isUndefined(results.imgur) && results.imgur.matchType === 'album') {
        const imgur = results.imgur;
        // This is not a public gallery
        if (imgur.privacy !== 'public') {
            append('Private Imgur Album');
        } else {
            append(`${logos.imgur} Album`);
            if (imgur.account_url && imgur.account_url !== 'null') append(imgur.account_url);
            if (imgur.title && imgur.title !== 'null') append(imgur.title);
            append(moment.unix(imgur.datetime).fromNow());
            if (imgur.description && imgur.description !== null) append(imgur.description);
            if (imgur.section && imgur.section !== 'null') append(imgur.section);
            append(`${imgur.images_count} ${imgur.images_count > 1 ? 'Images' : 'Image'}`);
            append(`${icons.views} ${c.navy(helpers.formatNumber(imgur.views))}`);
            if (imgur.nswf) append(c.red('NSFW'));
        }
    }
    // We have title
    else if (results.title && results.title !== '') {
        // Format title and adjust length
        append(_.truncate(results.title, {
            length: (
                _.isObject(app.Config.features.urls.titleMaxLimit) &&
                    results.to in app.Config.features.urls.titleMaxLimit &&
                    Number.isInteger(app.Config.features.urls.titleMaxLimit[results.to]) &&
                    app.Config.features.urls.titleMaxLimit[results.to] !== 0
            ) ?
                app.Config.features.urls.titleMaxLimit[results.to] :
                (
                    _.isNumber(app.Config.features.urls.defaultTitleAnnounceMax) ?
                        app.Config.features.urls.defaultTitleAnnounceMax :
                        255
                ),
        }));
    }
    // We have nothing but the malicious data
    else if (results.threats.length) append('posted a malicious Link');
    // Finished
    const finalOutput = output ? `${c[results.cached ? 'green' : 'red']('*')} ${results.from} ${icons.sideArrow} ${output}` : '';

    if (_.isEmpty(finalOutput)) return;


    // Report back to IRC
    app.say(results.to, finalOutput);

    // Threats detected Report back First
    if (results.threats.length) {
        _.each(results.threats, threat =>
            app.say(
                results.to,
                c.red(`| Warning ${_.startCase(threat.type).toLowerCase()} threat detected on ${results.url} for ${_.startCase(threat.platform).toLowerCase()}`),
            ));
    }
};

module.exports = formattingHelper;
