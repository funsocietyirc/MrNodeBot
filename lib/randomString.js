'use strict';

const random = require('./randomEngine');
const matchExpression = /{(.*?)}/gm;
module.exports = text => text.replace(matchExpression, (match, contents, offset, s) => random.pick(contents.split('|')));
