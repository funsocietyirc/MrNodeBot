const _ = require('lodash');
const moment = require('moment');

const filters = {
    name: 'Filter',
    filters: {
        truncate: function (text, length, separator) {
            return _.truncate(text || '', {
                length: length || 150,
                separator: separator || '...',
            });
        },
        uppercase: function (value) {
            if (!value) return;
            return _.toUpper(value);
        },
        toLowerCase: function (value) {
            if (!value) return;
            return _.toLower(value);
        },
        dateString: function (value) {
            return moment(value).format("YYYY-MM-DD HH:mm:ss")
        }
    },
};
module.exports = filters;
