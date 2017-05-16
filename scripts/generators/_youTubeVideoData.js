'use strict';
const endPointSingle = 'https://www.googleapis.com/youtube/v3/videos';
const endPointList = 'https://www.googleapis.com/youtube/v3/playlists';

const rp = require('request-promise-native');

// Playlist Only
const playlist = (apiKey, list) => {
    let base = {
        fields: 'items(id,snippet(channelId,title,channelTitle),contentDetails)',
        part: 'snippet,contentDetails'
    };

    return rp({
        uri: endPointList,
        qs: Object.assign(base, {
            key: apiKey,
            id: list,
        }),
        json: true
    });

};

// Track only
const video = (apiKey, key) => {
    let base = {
        fields: 'items(id,snippet(channelId,title,categoryId),statistics,contentDetails,status)',
        part: 'snippet,statistics,contentDetails,status'
    };

    return rp({
        uri: endPointSingle,
        qs: Object.assign(base, {
            key: apiKey,
            id: key
        }),
        json: true
    });
};

module.exports = (apiKey, key, list) => {
    // Playlist Only
    if (list !== null && key === null) return new Promise((res, rej) => {
        return playlist(apiKey, list)
            .then(playlistResults => {
                return res({
                    playlistResults: playlistResults.items,
                });
            })
            .catch(rej);
    });

    // Video Only
    if (list === null && key !== null) return new Promise((res, rej) => {
        return video(apiKey, key)
            .then(videoResults => {
                return res({
                    videoResults: videoResults.items,
                });
            })
            .catch(rej)
    });


    // Playlist and Video
    return new Promise((res, rej) => {
        return playlist(apiKey, list)
            .then(playlistResults => {
                return video(apiKey, key).then(videoResults => {
                    return res({
                        playlistResults: playlistResults.items,
                        videoResults: videoResults.items,
                    });
                });
            })
            .catch(rej);
    });

};

/**
 * Playlist Information
 * {
 "kind": "youtube#playlistListResponse",
 "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/4xLXKLUsml67H4unA76vO-lsYa4\"",
 "pageInfo": {
  "totalResults": 1,
  "resultsPerPage": 5
 },
 "items": [
  {
   "kind": "youtube#playlist",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/84yZ6dck3yenRmx2tvUgZby_4tY\"",
   "id": "PLmtTuSFT2UaKY4I_Q6WDQI7G98Z6lIU-n",
   "snippet": {
    "publishedAt": "2017-03-17T15:45:26.000Z",
    "channelId": "UCZzssFeR7Re5LAI8j2T6veQ",
    "title": "2017",
    "description": "Playlist created with http://www.playlist-converter.net, multi services playlist converter.",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/ja2_nS1en7k/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/ja2_nS1en7k/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/ja2_nS1en7k/hqdefault.jpg",
      "width": 480,
      "height": 360
     },
     "standard": {
      "url": "https://i.ytimg.com/vi/ja2_nS1en7k/sddefault.jpg",
      "width": 640,
      "height": 480
     },
     "maxres": {
      "url": "https://i.ytimg.com/vi/ja2_nS1en7k/maxresdefault.jpg",
      "width": 1280,
      "height": 720
     }
    },
    "channelTitle": "Dave Richer",
    "localized": {
     "title": "2017",
     "description": "Playlist created with http://www.playlist-converter.net, multi services playlist converter."
    }
   },
   "contentDetails": {
    "itemCount": 17
   }
  }
 ]
}

 **/


/**
 * Video JSON
 * {
 "kind": "youtube#videoListResponse",
 "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/8K_fYbjcdicbxWzP6eutJpkmdpU\"",
 "pageInfo": {
  "totalResults": 1,
  "resultsPerPage": 1
 },
 "items": [
  {
   "kind": "youtube#video",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/E8fOzZ-cfyZIC0koqgBLipxfXSI\"",
   "id": "5bA7nrdVEqE",
   "snippet": {
    "publishedAt": "2017-03-27T16:15:00.000Z",
    "channelId": "UCRzzwLpLiUNIs6YOPe33eMg",
    "title": "The Chainsmokers - The One (Audio)",
    "description": "The Chainsmokers debut album 'Memories... Do Not Open' is out now! \nBuy & Stream: http://smarturl.it/TCSMemories\nPhysical CD: http://smarturl.it/TCSMemoriesCD\nVinyl LP: http://smarturl.it/TCSMemoriesVinyl\n\nFollow The Chainsmokers:\nhttp://www.youtube.com/thechainsmokers\nhttp://www.twitter.com/thechainsmokers\nhttp://www.facebook.com/thechainsmokers\nhttp://www.instagram.com/thechainsmokers\nhttp://www.soundcloud.com/thechainsmokers",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/5bA7nrdVEqE/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/5bA7nrdVEqE/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/5bA7nrdVEqE/hqdefault.jpg",
      "width": 480,
      "height": 360
     },
     "standard": {
      "url": "https://i.ytimg.com/vi/5bA7nrdVEqE/sddefault.jpg",
      "width": 640,
      "height": 480
     },
     "maxres": {
      "url": "https://i.ytimg.com/vi/5bA7nrdVEqE/maxresdefault.jpg",
      "width": 1280,
      "height": 720
     }
    },
    "channelTitle": "ChainsmokersVEVO",
    "tags": [
     "Disruptor Records/Columbia",
     "The Chainsmokers",
     "The One",
     "Dance"
    ],
    "categoryId": "10",
    "liveBroadcastContent": "none",
    "localized": {
     "title": "The Chainsmokers - The One (Audio)",
     "description": "The Chainsmokers debut album 'Memories... Do Not Open' is out now! \nBuy & Stream: http://smarturl.it/TCSMemories\nPhysical CD: http://smarturl.it/TCSMemoriesCD\nVinyl LP: http://smarturl.it/TCSMemoriesVinyl\n\nFollow The Chainsmokers:\nhttp://www.youtube.com/thechainsmokers\nhttp://www.twitter.com/thechainsmokers\nhttp://www.facebook.com/thechainsmokers\nhttp://www.instagram.com/thechainsmokers\nhttp://www.soundcloud.com/thechainsmokers"
    }
   },
   "statistics": {
    "viewCount": "22258519",
    "likeCount": "448153",
    "dislikeCount": "11820",
    "favoriteCount": "0",
    "commentCount": "19174"
   }
  }
 ]
}

 *
 **/
