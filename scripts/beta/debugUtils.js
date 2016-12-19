'use strict';

const scriptInfo = {
    name: 'Debug Utils',
    desc: 'Bot Debugging',
    createdBy: 'IronY'
};

const _ = require('lodash');
const util = require('util');
const config = require('../../config');
const logger = require('../../lib/logger.js');
require('lodash-addons');

const simpleString = object =>
    util.inspect(object, {
        depth: null
    })
    .replace(/<Buffer[ \w\.]+>/ig, '"buffer"')
    .replace(/\[Function]/ig, 'function(){}')
    .replace(/\[Circular]/ig, '"Circular"')
    .replace(/\{ \[Function: ([\w]+)]/ig, '{ $1: function $1 () {},')
    .replace(/\[Function: ([\w]+)]/ig, 'function $1(){}')
    .replace(/(\w+): ([\w :]+GMT\+[\w \(\)]+),/ig, '$1: new Date("$2"),')
    .replace(/(\S+): ,/ig, '$1: null,');

module.exports = app => {
    const lineLength = _.getNumber(_.get(config.irc.messageSplit), 512);

    // Evaluate
    app.Commands.set('eval', {
        desc: '[valid js] will return value to console',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            try {
                let result = eval(text);
                result = _.isString(result) ? result : simpleString(result);
                let splitResults = result.split('\n') || [];
                logger.info(`Eval result:`, {
                    result: splitResults
                });
                _.each(splitResults, line => app._ircClient.cSay(from, to, line));
            } catch (err) {
                console.dir(err)
                logger.error('Eval command failed:', {
                    err
                });
            }
        }
    });


    return scriptInfo;
};
