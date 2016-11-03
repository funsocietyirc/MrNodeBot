'use strict';

const scriptInfo = {
    name: 'argSociety',
    desc: 'Misc functionality for ##mrRobotARG on freenode',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const rp = require('request-promise-native');
const scheduler = require('../../lib/scheduler');
const conLogger = require('../../lib/consoleLogger');
const type = require('../lib/_ircTypography');

module.exports = app => {
    const argChannel = '##mrRobotARG';
    const argReddit = 'argsociety';
    const redditStream = 'new';

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
                let diff = _.differenceWith(posts,lastPosts,_.isEqual);
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
        .then(result => conLogger(`Grabbing first ${argReddit} post for ${argChannel}`, 'info'))
        .catch(err => console.dir(err));


    // Assoicate the cron job for every 15 mins
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = [0, 15, 30, 45];
    const update = scheduler.schedule(`${argReddit}${argChannel}`, cronTime, () => {
        conLogger(`Running Reddit for ${argChannel}`, 'info');
        // We are not in the arg society channel
        if (!app.isInChannel(argChannel)) return;
        loadPosts()
            .then(results => {
                if (!results.updated) return; // No updates, bail
                _.each(results.posts, post => app.say(argChannel, `${type.logos.reddit} ${type.icons.sideArrow} ${post.author} ${type.icons.sideArrow} ${post.title} ${type.icons.sideArrow} ${post.url}`));
            })
            .catch(err => {
                console.log(`${argReddit} reddit error`);
                console.dir(err);
            });
    });
};
