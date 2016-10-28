'use strict';

const scriptInfo = {
  name: 'argSociety',
  file: 'argSociety.js',
  desc: 'Misc functionality for ##argSociety on freenode',
  createdBy: 'Dave Richer'
};

const _ = require('lodash');
const rp = require('request-promise-native');
const scheduler = require('../../lib/scheduler');
const conLogger = require('../../lib/consoleLogger');
const type = require('../lib/_ircTypography');

const argChannel = '##argSociety';

module.exports = app => {
    // Hold on to the posts
    let lastPost = [];

    // Load The posts
    const loadPosts = () => rp({
            headers: {
                'user-agent': 'MrNodeBot'
            },
            uri: 'https://www.reddit.com/r/argsociety/new/.json',
            json: true
        })
        .then(results => new Promise((resolve, reject) => {
            // We have No Data
            if (!_.has(results, 'data.children[0].data') || !results.data.children) {
                reject(new Error('The results object is malformed'));
                return;
            }

            // Get the first post
            let postRequest = _.first(results.data.children).data;

            // Format the post, we do this to prevent dynamic fields from triggering an announcement
            let post = {
                title: postRequest.title,
                url: postRequest.url,
                author: postRequest.author,
                created: postRequest.created
            };


            // We do not have a last post, keep this one
            if (!lastPost) {
              resolve({
                  updated: false,
                  post
              });
              return;
            }

            // See if it was updated
            let updated = !_.isEqual(post, lastPost);
            if (updated) lastPost = post;

            resolve({
                updated,
                post
            });
        }));

        // Run on load
        loadPosts()
          .then(result => conLogger('Grabbing first ArgSociety post','info'))
          .catch(err => console.dir(err));


    // Assoicate the cron job for every 15 mins
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = [0, 15, 30, 45];
    const update = scheduler.schedule('argSocietyReddit', cronTime, () => {
        conLogger('Running Reddit for argSociety', 'info');
        // We are not in the arg society channel
        if (!app.isInChannel(argChannel)) return;

        loadPosts()
            .then(result => {
                if (!result.updated) return;
                app.say(argChannel, `${type.logos.reddit} ${type.icons.sideArrow} New! ${type.icons.sideArrow} ${result.post.author} ${type.icons.sideArrow} ${result.post.title} ${type.icons.sideArrow} ${result.post.url}`);
            })
            .catch(err => {
                console.log('ArgSociety reddit error');
                console.dir(err);
            });
    });
};
