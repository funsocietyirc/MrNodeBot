'use strict';

const scriptInfo = {
    name: 'argSociety',
    desc: 'Misc functionality for ##mrRobotARG on freenode',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const rp = require('request-promise-native');
const scheduler = require('../../lib/scheduler');
const logger = require('../../lib/logger');
const type = require('../lib/_ircTypography');

module.exports = app => {
    const argChannel = '##mrRobotARG';
    const argReddit = 'argsociety';
    const redditStream = 'new';
    const delayInSeconds = 2;

    // Hold on to the posts
    let lastPosts = [];

    // Load The posts
    const loadPosts = () => rp({
            headers: {
                'user-agent': 'MrNodeBot'
            },
            uri: `https://www.reddit.com/r/${argReddit}/${redditStream}/.json`,
            json: true
        })
        .then(results => new Promise((resolve, reject) => {
            // We have No Data
            if (!_.has(results, 'data.children[0].data') || !results.data.children) {
                reject(new Error('No valid results available'));
                return;
            }

            // Get the first post
            let posts = _.map(results.data.children, post => new Object({
                title: post.data.title,
                url: post.data.url,
                author: post.data.author,
                created: post.data.created
            }));

            // We do not have a last post, keep this one
            if (!lastPosts) {
                lostPosts = posts;
                resolve({
                    updated: false,
                    posts: []
                });
                return;
            }

            // See if it was updated
            if (!_.isEqual(posts, lastPosts)) {
                let diff = _.differenceWith(posts, lastPosts, _.isEqual);
                lastPosts = posts;
                resolve({
                    updated: true,
                    posts: diff
                });
            }

            // No changes
            resolve({
                updated: false,
                posts: []
            });
        }));

    // Run on load
    loadPosts()
        .then(result => logger.info(`Grabbing first ${argReddit} post for ${argChannel}`))
        .catch(err => logger.error(err));


    // Assoicate the cron job for every 15 mins
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = [0, 15, 30, 45];
    const update = scheduler.schedule(`${argReddit}${argChannel}`, cronTime, () => {
        logger.info(`Running Reddit for ${argChannel}`);
        // We are not in the arg society channel
        if (!app.isInChannel(argChannel)) return;
        loadPosts()
            .then(results => {
                // No updates
                if (!results.updated) return;
                // Iterate each update, and send it back at a specified delay
                _.each(results.posts, (post, x) => setTimeout(
                    app.say(argChannel, `${type.logos.reddit} ${type.icons.sideArrow} ${post.author} ${type.icons.sideArrow} ${post.title} ${type.icons.sideArrow} ${post.url}`),
                    x * (delayInSeconds * 1000)
                ));
            })
            .catch(err => logger.error(`${argReddit} reddit error`, err));
    });
};
