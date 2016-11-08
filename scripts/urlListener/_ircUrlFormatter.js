'use strict';

const c = require('irc-colors');
const _ = require('lodash');
const config = require('../../config.js');
const helpers = require('../../helpers');
const moment = require('moment');
const ircTypography = require('../lib/_ircTypography');

const logos = ircTypography.logos;
const icons = ircTypography.icons;

// Formatting Helper
module.exports = (results) => {
        // Site is not live
        if (results.unreachable) {
            return `${c[results.cached ? 'green' : 'red']('*')} ${results.from} ${icons.sideArrow} ${c.blue(results.url)} ${icons.sideArrow} ${c.red.bold('Unverifiable Link')}`;
        }

        // Output chain helper functions
        let output = '';
        let space = () => output != '' ? ' ' + icons.sideArrow + ' ' : ' ';
        let append = text => {
            output = output + space() + text;
            return append;
        };

        // This is a re post
        if (results.history.length) {
            let history = _.first(results.history);
            let subOutput = '';
            if (history.from != results.from) {
                subOutput = subOutput + history.from;
            }
            if (history.to != results.to) {
                subOutput = subOutput + (history.from != results.from ? '/' : '') + history.to;
            }
            if (!_.isEmpty(subOutput)) {
                append(subOutput);
            }
        }

        // Print real URL
        if (results.realUrl && results.url != results.realUrl && results.realUrl.length < 160) {
            append(`${icons.anchor} ${c.navy(results.realUrl)}`);
        } else if(results.realUrl && results.url != results.realUrl) {
            append(`${icons.anchor} ${c.red('URL Redirected')}`)
        }

        // We have a Short URL
        if (!_.isUndefined(results.shortUrl) && !_.isEmpty(results.shortUrl) && results.url.length > config.features.urls.titleMin) {
            append(`${icons.anchor} ${c.navy(results.shortUrl)}`);
        }

        // We have a YouTube video response
        if (!_.isUndefined(results.youTube)) {
            let yr = results.youTube;
            append(logos.youTube)
                (yr.videoTitle)
                (`${icons.views} ${c.navy(helpers.NumberWithCommas(yr.viewCount))} ${icons.upArrow} ${c.green(helpers.NumberWithCommas(yr.likeCount))} ${icons.downArrow} ${c.red(helpers.NumberWithCommas(yr.dislikeCount))} ${icons.comments} ${c.blue(helpers.NumberWithCommas(yr.commentCount))}`);
        }

        // We have IMDB data
        else if (!_.isUndefined(results.imdb)) {
            let imdb = results.imdb;
            append(logos.imdb)
                (imdb.title)
                (imdb.year)
                (imdb.genre)
                (_.capitalize(imdb.type));
            if (imdb.seasons) append(`${c.bold('Seasons:')} ${imdb.seasons}`);
            if (imdb.rated) append(`${c.bold('Rated:')} ${imdb.rated}`);
            if (imdb.metaScore && imdb.metaScore != 'N/A') append(`${c.bold('MetaScore:')} ${imdb.metaScore}`);

            append(c[imdb.imdbRating < 5 ? 'red' : 'green'](`Rating: ${imdb.imdbRating}`))
                (`${icons.views} ${c.navy(imdb.imdbVotes)}`);
        }

        // We Have GitHub data
        else if (!_.isUndefined(results.gitHub)) {
            let gh = results.gitHub;
            append(logos.gitHub)(gh.owner)(gh.name)(gh.desc);
            if (gh.lastPush) append(`${icons.time} ${c.grey.bold('~')} ${moment(gh.lastPush).fromNow()}`);
            if (gh.isFork) append('Forked');
            if (gh.language) append(gh.language);
            if (gh.stars) append(`${icons.star} ${c.yellow(helpers.NumberWithCommas(gh.stars))}`);
            if (gh.views && gh.views != gh.stars) append(`${icons.views} ${c.navy(helpers.NumberWithCommas(gh.watchers))}`);
            if (gh.forks) append(`${c.bold(`Forks:`)} ${helpers.NumberWithCommas(gh.forks)}`);
            if (gh.issues) append(`${icons.sad} ${c.red(helpers.NumberWithCommas(gh.issues))}`);
        }
        // We Have BitBucket data
        else if(!_.isUndefined(results.bitBucket)) {
          let bb = results.bitBucket;
          append(`${logos.bitBucket} ${icons.sideArrow} ${bb.ownerDisplayName} ${icons.sideArrow} ${bb.desc ? bb.desc : 'BitBucket Repository'}`)
            (`${icons.time} ${c.grey.bold('~')} ${ moment(bb.lastPush).fromNow()}`)

          if(bb.language) append(bb.language);
          if(bb.hasIssues) append(icons.sad);
        }
        // We have Imgur image
        else if (!_.isUndefined(results.imgur) && results.imgur.matchType === 'image') {
          let imgur = results.imgur;
          append(`${logos.imgur} Image`);
          if(imgur.title && imgur.title != 'null') append(imgur.title);
          append(_.capitalize(imgur.type))
            (moment.unix(imgur.datetime).fromNow());
            if(imgur.section && imgur.section != 'null') append(imgur.section);
            if(imgur.description && imgur.description != 'null') append(imgur.description);
            append(`${imgur.width}x${imgur.height}`);
            if(imgur.animated) append('Animated');
            if(imgur.nswf) append(c.red('NSFW'));
            append(`${icons.views} ${c.navy(helpers.NumberWithCommas(imgur.views))}`);
        }
        // We have Imgur Gallery
        else if(!_.isUndefined(results.imgur) && results.imgur.matchType === 'gallery') {
          let imgur = results.imgur;
          append(`${logos.imgur} Gallery`)(imgur.account_url);
          if(imgur.title && imgur.title != 'null') append(imgur.title);
          append(moment.unix(imgur.datetime).fromNow());
          if(imgur.description && imgur.description != null) append(imgur.description);
          if(imgur.topic && imgur.topic != 'null') append(imgur.topic);
          if(imgur.section && imgur.section != 'null') append(imgur.section);
          append(`${imgur.images_count} ${imgur.images_count > 1 ? 'Images' : 'Image'}`)
          append(`${icons.views} ${c.navy(helpers.NumberWithCommas(imgur.views))}`)
            (`${icons.happy} ${c.green(helpers.NumberWithCommas(imgur.ups))}`)
            (`${icons.sad} ${c.red(helpers.NumberWithCommas(imgur.downs))}`)
            (`${icons.star} ${c.yellow(imgur.score)}`)
            (`${icons.comments} ${imgur.comment_count}`);
          if(imgur.nswf) append(c.red('NSFW'));
        }
        else {
          // We have a Title
          if (results.title && results.title != '') append(results.title);
        }

        // Finished
        return output ? `${c[results.cached ? 'green' : 'red']('*')} ${results.from} ${icons.sideArrow} ` + output : '';
};
