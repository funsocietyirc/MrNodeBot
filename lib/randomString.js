'use strict';
const matchExpression = /{(.*?)}/gm;
module.exports = (randomInstance, randomEngine, text) => text.replace(matchExpression, (match, contents, offset, s) => randomInstance.pick(randomEngine, contents.split('|')));
