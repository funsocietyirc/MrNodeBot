const _ = require('lodash');
const URL = require('url').URL; // TODO Here until we can figure why URI is not parsing the whole query string

const config = require('../../config');
const getYoutube = require('./_getYoutube.js'); // Get the youtube key from link
const getImdb = require('./_getImdb.js'); // Get IMDB Data
const getGitHub = require('./_getGithub'); // Get GitHub Information
const getBitBucket = require('./_getBitBucket'); // Get BitBucket Information
const getImgur = require('./_getImgurImage'); // Get Imgur data
const getTwitter = require('./_getTwitter'); // Get Twitter Data

/**
 *
 * @param results
 * @param app
 * @returns {Promise<*|{gitHub: {owner: *, forks: *, lastPush: *, name: *, watchers: *, fullName: *, language: *, stars: *, issues: *, isFork: *, desc: *}}|undefined|{bitBucket: {lastPush: *, ownerDisplayName: *, privateRepo: boolean, name: *, ownerUserName: *, fullName: *, language: *, hasIssues: *, desc: *}}|{bitBucket: {privateRepo: boolean}}>}
 */
const linkMatcher = async (results, app) => {
    // Use the realUrl if available when doing matches
    // This allows shortened urls to still hit
    const current = results.realUrl ? results.realUrl : results.url;
    const url = new URL(current); // TODO Node URL Module because the URI model has some weird query string parsing issues

    // No URI or URL
    if (!results.uri || !url) return results;

    switch (url.hostname) {
        case 'youtu.be':
        case 'www.youtu.be':
            const id = results.uri.segmentCoded(0);
            if (_.isString(id) && !_.isEmpty(id)) {
                return getYoutube(
                    id,
                    url.searchParams.get('list'),
                    url.searchParams.get('index'),
                    url.searchParams.get('t'),
                    results,
                );
            }
            break;
        case 'youtube.com': // Youtube
        case 'www.youtube.com':
            switch (results.uri.segmentCoded(0)) {
                // Play list link
                case 'playlist':
                    if (_.isString(url.searchParams.get('list'))) {
                        return getYoutube(
                            null,
                            url.searchParams.get('list'),
                            url.searchParams.get('index'),
                            url.searchParams.get('t'),
                            results,
                        );
                    }
                    break;
                case 'embed':
                case 'watch':
                default:
                    // Playlist
                    if (_.isString(url.searchParams.get('list')) && _.isString(url.searchParams.get('v'))) {
                        return getYoutube(
                            url.searchParams.get('v'),
                            url.searchParams.get('list'),
                            url.searchParams.get('index'),
                            url.searchParams.get('t'),
                            results,
                        );
                    }
                    // Single Video
                    else if (_.isString(url.searchParams.get('v'))) {
                        return getYoutube(
                            url.searchParams.get('v'),
                            null,
                            url.searchParams.get('index'),
                            url.searchParams.get('t'),
                            results,
                        );
                    }
                    break;
            }
            break;
        case 'imdb.com': // IMDB
        case 'www.imdb.com':
            // No API key for OMDB Provided
            if (!_.isString(config.apiKeys.omdb) || _.isEmpty(config.apiKeys.omdb)) break;
            const segments = results.uri.segmentCoded();
            if (_.includes(segments, 'title')) {
                const titleId = results.uri.segmentCoded(segments.indexOf('title') + 1);
                if (_.isString(titleId) && titleId.startsWith('tt')) return getImdb(titleId, results);
            }
            break;
        case 'i.imgur.com':
            const segment = results.uri.segmentCoded(0);
            if (!segment) break;
            const imageId = segment.substr(0, segment.lastIndexOf('.'));
            if (!imageId) break;
            if (imageId) return getImgur('image', imageId, results);
            switch (results.uri.segmentCoded(0)) {
                case 'image':
                case 'gallery':
                    if (results.uri.segmentCoded(1)) return getImgur(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results);
                    break;
                case 'album':
                case 'a':
                    if (results.uri.segmentCoded(1)) return getImgur('album', results.uri.segmentCoded(1), results);
                    break;
                default:
                    if (results.uri.segment().length === 1) return getImgur('image', results.uri.segmentCoded(0), results);
                    break;
            }
            break;
        case 'imgur.com': // Imgur
            switch (results.uri.segmentCoded(0)) {
                case 'image':
                case 'gallery':
                    if (results.uri.segmentCoded(1)) return getImgur(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results);
                    break;
                case 'album':
                case 'a':
                    if (results.uri.segmentCoded(1)) return getImgur('album', results.uri.segmentCoded(1), results);
                    break;
                default:
                    if (results.uri.segment().length === 1) return getImgur('image', results.uri.segmentCoded(0), results);
                    break;
            }
            break;
        case 'www.imgur.com':
            switch (results.uri.segmentCoded(0)) {
                case 'image':
                case 'gallery':
                    if (results.uri.segmentCoded(1)) return getImgur(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results);
                    break;
                case 'album':
                case 'a':
                    if (results.uri.segmentCoded(1)) return getImgur('album', results.uri.segmentCoded(1), results);
                    break;
                default:
                    if (results.uri.segment().length === 1) return getImgur('image', results.uri.segmentCoded(0), results);
                    break;
            }
            break;
        case 'github.com': // GitHub
        case 'www.github.com':
            if (results.uri.segment().length >= 2) return getGitHub(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results); // 2: User, 3: Repo
            break;
        case 'bitbucket.org': // BitBucket
        case 'www.butbucket.com':
            if (results.uri.segment().length >= 2) return getBitBucket(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results); // 2: User, 3: Repo
            break;
        case 't.co':
        case 'www.t.co':
            break;
        case 'twitter.com':
        case 'www.twitter.com':
            if (results.uri.segment().length >= 3 && results.uri.segmentCoded(1).toLowerCase() === 'status') return getTwitter(results.uri.segmentCoded(2), results.uri.segmentCoded(0), results, app);
            break;
    }

    return results;
};

module.exports = linkMatcher;
