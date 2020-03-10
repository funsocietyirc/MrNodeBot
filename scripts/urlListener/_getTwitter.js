const _ = require('lodash');
const gen = require('../generators/_getTwitterData');
const logger = require('../../lib/logger');
const helpers = require('../../helpers');

const getTwitter = async (key, user, results, app) => {
    // No Key provided, return the results
    if (!_.isString(key) || _.isEmpty(key) || !app._twitterClient) return results;

    try {
        const request = await gen(key, app._twitterClient);

        // No Data, or malformed data, bail
        if (
            !request ||
            !request.hasOwnProperty('data') ||
            !_.isObject(request.data) ||
            _.isEmpty(request.data)
        ) return results;

        const data = request.data;

        // Append Results
        results.twitter = {
            text: helpers.StripNewLine( data.truncated ? data.text : data.full_text),
            truncated: data.truncated,
            createdAt: data.created_at,
            retweetCount: data.retweet_count,
            favouriteCount: data.favourite_count,
            lang: data.lang,
            user: {
                screenName: data.user.screen_name,
                name: data.user.name,
                location: data.user.location,
                description: data.user.description,
                url: data.user.url,
                followers: data.user.followers_count,
                friends: data.user.friends_count,
                createdAt: data.user.created_at,
            }
        };

        return results;
    } catch (err) {
        logger.warn('Error in getTwitter URL function', {
            message: err.message || '',
            stack: err.stack || '',
        });

        return results;
    }
};

module.exports = getTwitter;
