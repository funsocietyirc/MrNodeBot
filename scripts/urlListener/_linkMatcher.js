'use strict';

const _ = require('lodash');
const getYoutube = require('./_getYoutube.js'); // Get the youtube key from link
const getImdb = require('./_getImdb.js'); // Get IMDB Data
const getGitHub = require('./_getGithub'); // Get GitHub Information
const getBitBucket = require('./_getBitBucket'); // Get BitBucket Information
const getImgur = require('./_getImgurImage'); // Get Imgur data

module.exports = results => new Promise(resolve => {
    // Use the realUrl if available when doing matches
    // This allows shortened urls to still hit
    let url = results.realUrl ? results.realUrl : results.url;

    // Check for youTube
    let ytMatch = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (ytMatch && ytMatch[2].length == 11) return resolve(getYoutube(ytMatch[2], results));

    // Check for IMDB
    let imdbMatch = url.match(/(?:www\.)?imdb.com\/title\/(tt[^\/]+).*/);
    if (imdbMatch && imdbMatch[1]) return resolve(getImdb(imdbMatch[1], results));

    // Check for Imgur
    let imgurMatch = url.match(/imgur\.com\/(image|gallery)\/(.*)/);
    if (imgurMatch && imgurMatch[1] && imgurMatch[2]) return resolve(getImgur(imgurMatch[1], imgurMatch[2], results));

    let imgurImageMatch = url.match(/(?:imgur\.com\/)(\w{3,7})/);
    if (imgurImageMatch && imgurImageMatch[1]) return resolve(getImgur('image', imgurImageMatch[1], results));

    // Get Generic Information
    let matches = url.match(/(?:git@(?![\w\.]+@)|https:\/{2}|http:\/{2})([\w\.@]+)[\/:]([\w,\-,\_]+)\/([\w,\-,\_]+)(?:\.git)?\/?/);
    // We have no further matches, bail
    if (!matches) return resolve(results);

    // Filter the remaining matches
    switch (matches[1].toLowerCase()) {
        case 'github.com':
            return resolve(getGitHub(matches[2], matches[3], results)); // 2: User, 3: Repo
        case 'bitbucket.org':
            return resolve(getBitBucket(matches[2], matches[3], results)); // 2: User, 3: Repo
        default:
            return resolve(results);
    }
});
