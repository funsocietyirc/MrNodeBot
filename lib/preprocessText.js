'use strict';
const random = require('./randomEngine');
const matchExpression = /{(.*?)}/gm;
const matchDelim = '|';
const _ = require('lodash');

module.exports = text => {
  // Something other then text, or empty text given
  if (!_.isString(text) || _.isEmpty(text)) return '';

  // Process the random string struct
  text = text.replace(
    matchExpression,
    (match, contents, offset, s) => random.pick(
      contents.split(matchDelim)
    )
  );

  return text;
};
