'use strict';
const scriptInfo = {
    name: 'SED Correction',
    file: 'correction.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const _ = require('lodash');
module.exports = app => {
    // Assure the database and logging table exists
    if (!app.Database && !Models.Logging) {
        return;
    }
    // Logging Model
    const loggingModel = Models.Logging;
    const correct = (to, from, text, message) => {
        text = _.trim(text);

        if (!text || !_.startsWith(text, 's/') || _.includes(text,'ᴥ')) {
            return;
        }

        if(text[text.length - 1] === '/') {
          text = text.slice(0,-1);
        }

        text = _.replace(text, 's/', '').replaceAll('//', 'ᴥ');
        let replacement = text.slice(text.lastIndexOf('/'));
        if (!replacement) {
            return;
        }
        text = _.replace(text, replacement, '').trim();

        replacement = replacement.substr(1).replaceAll('ᴥ','//').trim();
        text = text.replaceAll('ᴥ', '//').trim();

        if (!text || !replacement) {
            return;
        }
        let found = false;
        Models.Logging.query(qb => {
                qb
                    .select(['id', 'to', 'from', 'text'])
                    .where('to', to)
                    .andWhere('text','not like','s/%')
                    .orderBy('id', 'desc')
                    .limit(50)
            })
            .fetchAll()
            .then(results => {
                if (!results || !results.length) {
                    return;
                }
                results.forEach(result => {
                    let resultText = result.get('text');
                    if (found || !_.includes(resultText, text)) {
                        return;
                    }
                    found = true;
                    let finalReplacement = _.replace(resultText, text, replacement);
                    if (!finalReplacement) {
                        return;
                    }
                    app.say(to, `[${result.get('from')}]: ${finalReplacement}`);
                });
            });
    };

    // Listen and Correct
    app.Listeners.set('corrections', {
        desc: 'SED Corrections',
        call: correct
    });

    return scriptInfo;
};
