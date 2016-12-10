'use strict';
const db = require('./database/client');
const Models = require('bookshelf-model-loader');
const config = require('./config');
const markov = require('markov');

const m = markov(3);

Models.Logging.query(qb => qb.where('from', 'jeek')).fetchAll().then(results => {
    let textArray = results.pluck('text');
    textArray.forEach(text => m.seed(text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,' ')));
    var stdin = process.openStdin();
    console.log('> ');

    stdin.on('data', function(line) {
        var res = m.respond(line.toString()).join(' ');
        console.log(res);
        console.log('> ');
    });
});
