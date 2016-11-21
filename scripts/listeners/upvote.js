'use strict';
const scriptInfo = {
    name: 'Upvote',
    desc: 'Upvote action listener',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');

module.exports = app => {
  // Primary Logic
  const upvote = (from, to, text, message) => {
  };

  // Register with actions
  app.Actions.set('upvote', {
    desc: 'Provide a Upvote system',
    call: upvote
  });

  return scriptInfo;
};
