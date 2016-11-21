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
    // Primary Logic
    const pattern = /gives (.*) (\+|\-)1/;
    const upvote = (from, to, text, message) => {
        // See if we get a match
        let result = text.match(pattern);
        console.dir(result);

        // No valid result, or candidate is not in channel, or invalid vote
        if (!result || !result[0] || !result[1] || !result[2] || result[1] == from) return;

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
