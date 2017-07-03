'use strict';

const config = require('../../config');

const URL = require('url').URL; // TODO Here until we can figure why URI is not parsing the whole query string

const _ = require('lodash');
const getYoutube = require('./_getYoutube.js'); // Get the youtube key from link
const getImdb = require('./_getImdb.js'); // Get IMDB Data
const getGitHub = require('./_getGithub'); // Get GitHub Information
const getBitBucket = require('./_getBitBucket'); // Get BitBucket Information
const getImgur = require('./_getImgurImage'); // Get Imgur data


module.exports = results => new Promise(resolve => {
    // Use the realUrl if available when doing matches
    // This allows shortened urls to still hit
    const current = results.realUrl ? results.realUrl : results.url;
    const url = new URL(current); // TODO Node URL Module because the URI model has some weird query string parsing issues

    // No URI or URL
    if (!results.uri || !url) return resolve(results);

    switch (url.hostname) {
        case 'youtu.be':
        case 'www.youtu.be':
            const id = results.uri.segmentCoded(0);
            if(_.isString(id) && !_.isEmpty(id)) {
              return resolve(
                  getYoutube(
                      id,
                      url.searchParams.get('list'),
                      url.searchParams.get('index'),
                      url.searchParams.get('t'),
                      results
                  )
              );
            }
            break;
        case 'youtube.com': // Youtube
        case 'www.youtube.com':
            switch (results.uri.segmentCoded(0)) {
                // Play list link
                case 'playlist':
                    if (_.isString(url.searchParams.get('list')))
                        return resolve(
                            getYoutube(
                                null,
                                url.searchParams.get('list'),
                                url.searchParams.get('index'),
                                url.searchParams.get('t'),
                                results
                            )
                        );
                    break;
                case 'embed':
                case 'watch':
                default:
                    // Playlist
                    if (_.isString(url.searchParams.get('list')) && _.isString(url.searchParams.get('v')))
                        return resolve(
                            getYoutube(
                                url.searchParams.get('v'),
                                url.searchParams.get('list'),
                                url.searchParams.get('index'),
                                url.searchParams.get('t'),
                                results
                            )
                        );
                    // Single Video
                    else if (_.isString(url.searchParams.get('v')))
                        return resolve(
                            getYoutube(
                                url.searchParams.get('v'),
                                null,
                                url.searchParams.get('index'),
                                url.searchParams.get('t'),
                                results
                            )
                        );
                    break;

            }
            break;
        case 'imdb.com': // IMDB
        case 'www.imdb.com':
            // No API key for OMDB Provided
            if(!_.isString(config.apiKeys.omdb) || _.isEmpty(config.apiKeys.omdb)) break;
            let segments = results.uri.segmentCoded();
            if (segments.indexOf('title') !== -1) {
                let titleId = results.uri.segmentCoded(segments.indexOf('title') + 1);
                if ( _.isString(titleId) && titleId.startsWith('tt')) return resolve(getImdb(titleId, results));
            }
            break;
        case 'imgur.com': // Imgur
        case 'www.imgur.com':
            if (results.uri.subdomain() === 'i') {
                let segment = results.uri.segmentCoded(0);
                if (!segment) break;
                let imageId = segment.substr(0, segment.lastIndexOf('.'));
                if (!imageId) break;
                if (imageId) return resolve(getImgur('image', imageId, results));
            }
            switch (results.uri.segmentCoded(0)) {
                case 'image':
                case 'gallery':
                    if (results.uri.segmentCoded(1)) return resolve(getImgur(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results));
                    break;
                case 'album':
                case 'a':
                    if (results.uri.segmentCoded(1)) return resolve(getImgur('album', results.uri.segmentCoded(1), results));
                    break;
                default:
                    if (results.uri.segment().length === 1) return resolve(getImgur('image', results.uri.segmentCoded(0), results));
                    break;
            }
            break;
        case 'github.com': // GitHub
        case 'www.github.com':
            if (results.uri.segment().length >= 2) return resolve(getGitHub(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results)); // 2: User, 3: Repo
            break;
        case 'bitbucket.org': // BitBucket
        case 'www.butbucket.com':
            if (results.uri.segment().length >= 2) return resolve(getBitBucket(results.uri.segmentCoded(0), results.uri.segmentCoded(1), results)); // 2: User, 3: Repo
            break;
    }

    // No Matches
    return resolve(results);
});
