'use strict';
const scriptInfo = {
    name: 'SED Correction',
    file: 'correction.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');

module.exports = app => {
  // Assure the database and logging table exists
  if (!app.Database && !Models.Logging) {
      return;
  }

  // Regular Expression to match
  const expression = /^[sS]\/(.*\/.*(?:\/[igx]{,4})?)\S*$/;


  // Logging Model
  const loggingModel = Models.Logging;

  const correct = (to, from, text, message) => {
    let results = text.match(expression);
    results.forEach(i => {
    });
  };

  // Listen and Correct
  app.Listeners.set('corrections', {
      desc: 'SED Corrections',
      call: correct
  });

return scriptInfo;
};
