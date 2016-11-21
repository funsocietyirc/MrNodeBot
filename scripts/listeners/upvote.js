'use strict';
const scriptInfo = {
    name: 'Upvote',
    desc: 'Upvote action listener',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = app => {
    // Database not available
    if(!Models.Upvote) return scriptInfo;

    // Primary Logic
    // Example IronY gives <nick> a plus or minus +1
    const pattern = /gives (.*) (\+|\-)1/;
    const upvote = (from, to, text, message) => {
        // See if we get a match
        let result = text.match(pattern);

        // No valid result, or candidate is not in channel, or invalid vote
        if (!result || !result[0] || !result[1] || !result[2]) return;

        // Channels mismatch

        // Trying to vote on yourself
        if(result[1] == from) {
          app.say(from, `It is considered incredibly condescending to cast a vote for yourself`);
          return;
        }

        // Users are not in channel
        if(!app.isInChannel(to, result[1]) || !app.isInChannel(to, from)) {
          return;
        }

        // Create the record
        Models.Upvote.create({
                candidate: result[1],
                voter: from,
                channel: to,
                result: result[2] == '+' ? 1 : -1
            })
            .then(record => app.notice(from, `You have just given ${result[1]} a ${result[2]} vote on ${to}`))
            .catch(err => logger.error(`Error in upvote system`, {
                err
            }));
    };

    // Register with actions
    app.Actions.set('upvote', {
        desc: 'Provide a Upvote system',
        call: upvote
    });

    return scriptInfo;
};
