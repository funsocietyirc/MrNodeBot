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
    },
};
module.exports = filters;
