'use strict';

module.exports = (url, to, from, text, message, is) => new Promise((resolve, reject) => {
  if (!url || !to || !from || !text || !message) return reject({
    message: 'You are missing a required argument'
  });
  resolve({
    url,
    to,
    from,
    text,
    message,
    is,
    delivered: [],
    secure: url.startsWith('https://'),
    history: [],
    threats: [],
  });
});
