const i18next = require('./i18next');

i18next.changeLanguage('en', (err, t) => {
    module.exports = t;
});
