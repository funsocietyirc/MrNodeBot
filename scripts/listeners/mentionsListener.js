'use strict';
const scriptInfo = {
  name: 'Mention Listener',
  desc: 'Keep track of mentions',
  createdBy: 'IronY'
};
const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
// Special Thanks to [mbm] for this wonderful regex
const pattern = /\B@((?!\w*\.\w)[\w\[\]|\-`\\{}\^]{1,16}(?!\w))/gi;


module.exports = app => {
  // Assure the database and logging table exists
  if (!Models.Mention || !Models.Mentioned) return scriptInfo;
  // Parse for mentions
  const mentions = (to, from, text, message) => {
    // Priv message or empty string, bail
    if (to === from || !_.trim(text)) return;

    // Setup variables
    let match = null;
    let results = [];

    // Check for matches
    while (match = pattern.exec(text)) results.push(match[1]);

    // No initial results, bail
    if (_.isEmpty(results)) return;

    // Filter out duplicates, and verify the users are in the channel
    results = _(results)
      .uniqBy(r => r.toLowerCase())
      .filter(r => app._ircClient.isInChannel(to, r) && r.toLowerCase() !== from.toLowerCase())
      .value();

    // No results after filtering, bail
    if (_.isEmpty(results)) return;

    Models.Mention.create({
        text: text,
        by: from,
        channel: to,
        user: message.user,
        host: message.host,
      })
      .then(mention => {
        let mentionStack = [];
        _.forEach(results, nick => mentionStack.push(Models.Mentioned.create({
          nick: nick,
          mention_id: mention.id,
        })));
        return Promise.all(mentionStack);
      })
      .then(() => logger.info(`Mention recorded on ${to} by ${from} mentioning ${results.join(', ')}`))
      .catch(err => logger.error('Error recording mention', {
        err
      }));
  };
  // Listen to messages
  app.Listeners.set('mentions', {
    desc: 'Mentions',
    call: mentions
  });
  // Listen to Actions
  app.OnAction.set('mentions', {
    call: (from, to, text, message) => mentions(to, from, text, message),
    name: 'mentions'
  });

  // All went OK
  return scriptInfo;
};
