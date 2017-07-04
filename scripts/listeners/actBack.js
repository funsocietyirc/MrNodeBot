'use strict';
/**
 * React back to a action
 * @module react back
 * @author Dave Richer
 */
const scriptInfo = {
    name: 'Act Back',
    desc: 'Mock back actions',
    createdBy: 'IronY',
    actions: {}
};
const _ = require('lodash');

module.exports = app => {
    const actBack = scriptInfo.actions.actBack = (from, to, text, message) => {
        // Gate
        if (!_.isString(text) || _.isEmpty(text)) return;

        const matches = text.match(new RegExp('^(.*)\\s' + app.nick + '(?:\\s(.*))?$', 'i'));

        // No matches available, bail
        if (!matches || !matches[0] || !matches[1]) return;

        const action = matches[1];
        const context = matches[2];

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
