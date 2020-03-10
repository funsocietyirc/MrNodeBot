// Export the generator
module.exports = async (key, twitterClient) => {
    return twitterClient.get(`statuses/show/${key}`, {tweet_mode: 'extended'});
};

// (nixonix) ✓@Steven_Swinford (Steven Swinford): EXCLUSIVE Nadine Dorries, a health minister, has become first MP to be diagnosed with coronavirus
// She has been in Westminster for past week, met hundreds of people, and attended a No 10 reception hosted by Boris Johnson on Thursday https://t.co/3seuE2NGYE (20 minutes and 5 seconds ago)

/**

 created_at: 'Tue Mar 10 22:19:59 +0000 2020',
 id: 1237503494325559300,
 id_str: '1237503494325559296',
 text: 'EXCLUSIVE\n' +
 '\n' +
 'Nadine Dorries, a health minister, has become first MP to be diagnosed with coronavirus\n' +
 '\n' +
 'She has been in… https://t.co/G5Se4KuUbJ',
 truncated: true,
 entities: { hashtags: [], symbols: [], user_mentions: [], urls: [ [Object] ] },
 source: '<a href="https://about.twitter.com/products/tweetdeck" rel="nofollow">TweetDeck</a>',
 in_reply_to_status_id: null,
 in_reply_to_status_id_str: null,
 in_reply_to_user_id: null,
 in_reply_to_user_id_str: null,
 in_reply_to_screen_name: null,
 user: {
    id: 224568664,
    id_str: '224568664',
    name: 'Steven Swinford',
    screen_name: 'Steven_Swinford',
    location: 'London',
    description: 'Deputy Political Editor, The Times',
    url: 'https://t.co/GAsNZjVp0D',
    entities: { url: [Object], description: [Object] },
    protected: false,
    followers_count: 43194,
    friends_count: 827,
    listed_count: 1051,
    created_at: 'Thu Dec 09 09:44:10 +0000 2010',
    favourites_count: 47,
    utc_offset: null,
    time_zone: null,
    geo_enabled: true,
    verified: true,
    statuses_count: 15193,
    lang: null,
    contributors_enabled: false,
    is_translator: false,
    is_translation_enabled: false,
    profile_background_color: 'C0DEED',
    profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
    profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
    profile_background_tile: false,
    profile_image_url: 'http://pbs.twimg.com/profile_images/622061127330045953/7fmmsCM1_normal.jpg',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/622061127330045953/7fmmsCM1_normal.jpg',
    profile_banner_url: 'https://pbs.twimg.com/profile_banners/224568664/1531224795',
    profile_link_color: '1DA1F2',
    profile_sidebar_border_color: 'C0DEED',
    profile_sidebar_fill_color: 'DDEEF6',
    profile_text_color: '333333',
    profile_use_background_image: true,
    has_extended_profile: true,
    default_profile: true,
    default_profile_image: false,
    following: false,
    follow_request_sent: false,
    notifications: false,
    translator_type: 'none'
  },
 geo: null,
 coordinates: null,
 place: null,
 contributors: null,
 is_quote_status: false,
 retweet_count: 2300,
 favorite_count: 1370,
 favorited: false,
 retweeted: false,
 possibly_sensitive: false,
 possibly_sensitive_appealable: false,
 lang: 'en'
 }

**/
