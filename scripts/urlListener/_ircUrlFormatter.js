'use strict';

const c = require('irc-colors');
const _ = require('lodash');
const config = require('../../config.js');
const helpers = require('../../helpers');
const moment = require('moment');


const logos = {
    youTube: c.grey.bold('You') + c.red.bold('Tube'),
    gitHub: c.grey.bold('GitHub'),
    bitBucket: c.navy.bold('BitBucket'),
    imdb: c.brown.bold('IMDB'),
};

const icons = {
    upArrow: c.green.bold('↑'),
    downArrow: c.red.bold('↓'),
    views: c.navy.bold('⚘'),
    comments: c.blue.bold('✍'),
    sideArrow: c.grey.bold('→'),
    anchor: c.navy.bold('⚓'),
    star: c.yellow('✡'),
    happy: c.green.bold('☺'),
    sad: c.red.bold('☹'),
    time: c.grey.bold('@')
};

// Formatting Helper
module.exports = (results) => {
        // Output chain helper functions
        let output = '';
        let space = () => output != '' ? ' ' + icons.sideArrow + ' ' : ' ';
        let append = text => {
            output = output + space() + text;
            return append;
        };

        // We have a Short URL
        if (!_.isUndefined(results.shortUrl) && !_.isEmpty(results.shortUrl) && results.url.length > config.features.urls.titleMin) {
            append(`${icons.anchor} ${c.navy(results.shortUrl)}`);
        }

        // We have a Title
        if (results.title && results.title != '') append(results.title);

        // We have a YouTube video response
        if (!_.isUndefined(results.youTube)) {
            let yr = results.youTube;
            append(logos.youTube)
                (yr.videoTitle)
                (`${icons.views} ${c.navy(helpers.NumberWithCommas(yr.viewCount))} ${icons.upArrow} ${c.green(helpers.NumberWithCommas(yr.likeCount))} ${icons.downArrow} ${c.red(helpers.NumberWithCommas(yr.dislikeCount))} ${icons.comments} ${c.blue(helpers.NumberWithCommas(yr.commentCount))}`);
        }

        // We have IMDB data
        if (!_.isUndefined(results.imdb)) {
            let imdb = results.imdb;
            append(logos.imdb)
                (imdb.title)
                (imdb.year)
                (imdb.genre)
                (_.capitalize(imdb.type));
            if (imdb.seasons) append(`${c.bold('Seasons:')} ${imdb.seasons}`);
            if (imdb.rated) append(`${c.bold('Rated:')} ${imdb.rated}`);
            if (imdb.metaScore) append(`${c.bold('MetaScore:')} ${imdb.metaScore}`);

            append(c[imdb.imdbRating < 5 ? 'red' : 'green'](`Rating: ${imdb.imdbRating}`))
                (`${icons.views} ${c.navy(imdb.imdbVotes)}`);
        }

        // We Have GitHub data
        if (!_.isUndefined(results.gitHub)) {
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
        if(!_.isUndefined(results.bitBucket)) {
          let bb = results.bitBucket;
          append(`${logos.bitBucket} ${icons.sideArrow} ${bb.ownerDisplayName} ${icons.sideArrow} ${bb.desc ? bb.desc : 'BitBucket Repository'}`)
            (`${icons.time} ${c.grey.bold('~')} ${ moment(bb.lastPush).fromNow()}`)

          if(bb.language) append(bb.language);
          if(bb.hasIssues) append(icons.sad);
        }

        // Finished
        return output ? `${results.from} ${icons.sideArrow} ` + output : '';
};
