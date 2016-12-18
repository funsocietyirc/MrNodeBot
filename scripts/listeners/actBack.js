'use strict';
const scriptInfo = {
    name: 'Act Back',
    desc: 'Mock back actions',
    createdBy: 'IronY'
};

const _ = require('lodash');

module.exports = app => {
    const actBack = (from, to, text, message) => {
      if(!_.isString(text) || _.isEmpty(text)) return;
      let matches = text.match(new RegExp('^(.*)\\s' + app.nick + '(?:\\s(.*))?$','i'));
      // No matches available, bail
      if(!matches || !matches[0] || !matches[1]) return;
      let action = matches[1];
      let context = matches[2];
      app.action(to, `${action} ${from} ${context || ''}`);
    };
    // Listen to Actions
    app.OnAction.set('actBack', {
        call: actBack,
        name: 'actBack'
    });

    // All went OK
    return scriptInfo;
};
