'use strict';
const scriptInfo = {
    name: 'Urban Dictionary',
    desc: 'Look up a term with the urban dictionary',
    createdBy: 'IronY'
};
const _ = require('lodash');
const util = require('util');
const logger = require('../../lib/logger.js');
const dict = require('../generators/_getUrbanDictionaryDefinition');
const short = require('../lib/_getShortService');

module.exports = app => {
    app.Commands.set('urban', {
        desc: '[term] - Urban Dictionary Lookup',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => dict(text)
            .then(results => {
                let definition = _.truncate(results.definition, {
                    length: 300
                });
                return short(results.url)
                    .then(shortUrl => app.say(to, `${results.term}: ${definition} - ${shortUrl}`));
            })
            .catch(err => app.say(to, `Urban Dictionary Error: ${err.message}`))
    });
    return scriptInfo;
};
