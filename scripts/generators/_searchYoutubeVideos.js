'use strict';

const endPoint = 'https://www.googleapis.com/youtube/v3/search';
const rp = require('request-promise-native');
const logger = require('../../lib/logger');

module.exports = async(apiKey, title) => {
  if (!apiKey || !title) return {
    items: []
  };

  try {
    // Fetch Results
    const results = await rp({
      uri: endPoint,
      qs: {
        part: 'id,snippet',
        q: title,
        order: 'title',
        maxResults: 10,
        key: apiKey,
      },
      json: true
    });
    return (!results || !results.items) ? {
      items: []
    } : {
      items: results.items.map(item => Object.assign({}, item.snippet, {
        videoId: item.id.videoId
      }))
    };

  } catch (err) {
    logger.log('Error in the youtube search generator');
    return {
      items: []
    };
  }
};

/**
{
 "kind": "youtube#searchListResponse",
 "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/jRylJXQvKOncoNQQp3p7a5bj1B8\"",
 "nextPageToken": "CAUQAA",
 "regionCode": "CA",
 "pageInfo": {
  "totalResults": 1000000,
  "resultsPerPage": 5
 },
 "items": [
  {
   "kind": "youtube#searchResult",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/unxm4kDs0G-i_VEf5N9--J7ujys\"",
   "id": {
    "kind": "youtube#video",
    "videoId": "pCrV2LpTfJ8"
   },
   "snippet": {
    "publishedAt": "2017-02-02T21:00:02.000Z",
    "channelId": "UC1Ydgfp2x8oLYG66KZHXs1g",
    "title": "10 Photos To Test Your Personality",
    "description": "10 pictures that will determine what kind of person you are. Subscribe: https://goo.gl/Hnoaw3 ...",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/pCrV2LpTfJ8/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/pCrV2LpTfJ8/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/pCrV2LpTfJ8/hqdefault.jpg",
      "width": 480,
      "height": 360
     }
    },
    "channelTitle": "TheTalko",
    "liveBroadcastContent": "none"
   }
  },
  {
   "kind": "youtube#searchResult",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/WePlVVP0Z4fWK6zl92pA9jVLbdQ\"",
   "id": {
    "kind": "youtube#video",
    "videoId": "2a4Uxdy9TQY"
   },
   "snippet": {
    "publishedAt": "2014-11-22T10:31:23.000Z",
    "channelId": "UCroqujvAIVKTBvJbE2E9cCA",
    "title": "Idiot Test - 90% fail",
    "description": "IMBECILE TEST: https://www.youtube.com/watch?v=qyskC8jj05A This video will test your idiot nature by asking you some questions - are you prone to being ...",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/2a4Uxdy9TQY/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/2a4Uxdy9TQY/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/2a4Uxdy9TQY/hqdefault.jpg",
      "width": 480,
      "height": 360
     }
    },
    "channelTitle": "Thomas8april",
    "liveBroadcastContent": "none"
   }
  },
  {
   "kind": "youtube#searchResult",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/f-CHGucKoah-GfYvaJAu2ZAhgWE\"",
   "id": {
    "kind": "youtube#video",
    "videoId": "eUt5kzEoOp4"
   },
   "snippet": {
    "publishedAt": "2016-12-24T18:10:28.000Z",
    "channelId": "UCYenDLnIHsoqQ6smwKXQ7Hg",
    "title": "FIND OUT WHO YOU REALLY ARE.  VIDEO TEST",
    "description": "TechZone ? https://www.youtube.com/channel/UC6H07z6zAwbHRl4Lbl0GSsw Hi everyone! Do you think you know yourself fully? We did too... But there are ...",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/eUt5kzEoOp4/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/eUt5kzEoOp4/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/eUt5kzEoOp4/hqdefault.jpg",
      "width": 480,
      "height": 360
     }
    },
    "channelTitle": "#Mind Warehouse",
    "liveBroadcastContent": "none"
   }
  },
  {
   "kind": "youtube#searchResult",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/UfUsDMs65nnkCKPINKYYHHbd6Jk\"",
   "id": {
    "kind": "youtube#channel",
    "channelId": "UC9EZGiMrK8-OYbLH3Yfj_QQ"
   },
   "snippet": {
    "publishedAt": "2009-12-22T17:11:17.000Z",
    "channelId": "UC9EZGiMrK8-OYbLH3Yfj_QQ",
    "title": "IQ Tests | Personality Tests | Funny Test Videos",
    "description": "SUBSCRIBE: I'm interested in doing more than 1000 tests! IQ Test, Personality Test, Love Test, Mind Tricks, Just For Laughs, Funny Test, Just For Fun Quizzes, ...",
    "thumbnails": {
     "default": {
      "url": "https://yt3.ggpht.com/-tfIyiEv1mN8/AAAAAAAAAAI/AAAAAAAAAAA/jNKG7pboRKc/s88-c-k-no-mo-rj-c0xffffff/photo.jpg"
     },
     "medium": {
      "url": "https://yt3.ggpht.com/-tfIyiEv1mN8/AAAAAAAAAAI/AAAAAAAAAAA/jNKG7pboRKc/s240-c-k-no-mo-rj-c0xffffff/photo.jpg"
     },
     "high": {
      "url": "https://yt3.ggpht.com/-tfIyiEv1mN8/AAAAAAAAAAI/AAAAAAAAAAA/jNKG7pboRKc/s240-c-k-no-mo-rj-c0xffffff/photo.jpg"
     }
    },
    "channelTitle": "IQ Tests | Personality Tests | Funny Test Videos",
    "liveBroadcastContent": "none"
   }
  },
  {
   "kind": "youtube#searchResult",
   "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/S6aG1jDgirrqEgwy0RG1hHNwN50\"",
   "id": {
    "kind": "youtube#video",
    "videoId": "xsPHeH-pNQU"
   },
   "snippet": {
    "publishedAt": "2015-04-10T19:36:16.000Z",
    "channelId": "UC9EZGiMrK8-OYbLH3Yfj_QQ",
    "title": "? Which Nickname is Perfect For You? (Personality Test)",
    "description": "What nickname fits you best? What is your cute nickname? What is your best nickname? What should your nickname be? Be my friend on Facebook ...",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/xsPHeH-pNQU/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/xsPHeH-pNQU/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/xsPHeH-pNQU/hqdefault.jpg",
      "width": 480,
      "height": 360
     }
    },
    "channelTitle": "IQ Tests | Personality Tests | Funny Test Videos",
    "liveBroadcastContent": "none"
   }
  }
 ]
}

 **/
