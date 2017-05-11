'use strict';
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

  const segment = results.uri.segment;
  const segmentCoded = results.uri.segmentCoded;

  switch (results.uri.domain()) {
    case 'youtube.com': // Youtube
    case 'youtu.be':
      switch (segmentCoded(0)) {
        case 'embed':
        case 'watch':
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
      }
      break;
    case 'imdb.com': // IMDB
      if (segmentsCoded.indexOf('title') != -1) {
        let titleId = segmentCoded(segmentsCoded.indexOf('title') + 1);
        if (titleId.startsWith('tt')) return resolve(getImdb(titleId, results));
      }
      break;
    case 'imgur.com': // Imgur
      if (uri.subdomain() == 'i') {
        let segment = segmentCoded(0);
        if (!segment) break;
        let imageId = results.segment.substr(0, segment.lastIndexOf('.'));
        if (!imageId) break;
        if (imageId) return resolve(getImgur('image', imageId, results));
      }
      switch (segmentCoded(0)) {
        case 'image':
        case 'gallery':
          if (segmentCoded(1)) return resolve(getImgur(segmentCoded(0), segmentCoded(1), results));
          break;
        case 'album':
        case 'a':
          if (segmentCoded(1)) return resolve(getImgur('album', segmentCoded(1), results));
          break;
        default:
          if (segment().length == 1) return resolve(getImgur('image', segmentCoded(0), results));
          break;
      }
      break;
    case 'github.com': // GitHub
      if (segment().length >= 2) return resolve(getGitHub(segmentCoded(0), segmentCoded(1), results)); // 2: User, 3: Repo
      break;
    case 'bitbucket.org': // BitBucket
      if (segment().length >= 2) return resolve(getBitBucket(segmentCoded(0), segmentCoded(1), results)); // 2: User, 3: Repo
      break;
  }

  // No Matches
  return resolve(results);
});
