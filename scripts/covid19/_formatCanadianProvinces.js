const _ = require('lodash');
/**
 * Valid Short Names
 * @type {string[]}
 */
const validShortNames = [
  'bc', 'ab', 'sk', 'mb', 'on', 'nb', 'ns', 'pe', 'pei','nl','yt','nt','nu','qc','travellers','repatriated'
];
/**
 * Format Names
 * @param name
 * @returns {string}
 */
const reverseFormatCanadianProvinces = (name) => {
    if(!_.isString(name)) return name;
    switch (name.toLowerCase()) {
        case 'bc':
            return 'british columbia';
        case 'ab':
            return 'alberta';
        case 'sk':
            return 'saskatchewan';
        case 'mb':
            return 'manitoba';
        case 'on':
            return 'ontario';
        case 'nb':
            return 'new brunswick';
        case 'ns':
            return 'nova scotia';
        case 'pe':
        case 'pei':
            return 'prince edward island';
        case 'nl':
            return 'newfoundland and labrador';
        case 'yt':
            return 'yukon';
        case 'nt':
            return 'northwest territories';
        case 'nu':
            return 'nunavut';
        case 'qc':
            return 'quebec';
        case 'repatriated':
        case 'travellers':
            return 'repatriated travellers';
        default:
            return name;
    }
};

/**
 * Valid Long Names
 * @type {string[]}
 */
const validLongNames = ['british columbia', 'alberta', 'saskatchewan', 'manitoba', 'ontario', 'new brunswick', 'nova scotia', 'prince edward island', 'pei', 'newfoundland and labrador', 'yukon', 'northwest territories', 'nunavut', 'repatriated', 'repatriated travellers', 'quebec'];

const formatCanadianProvinces = (name) => {
    if(!_.isString(name)) return name;
    switch (name.toLowerCase()) {
        case 'british columbia':
            return 'BC';
        case 'alberta':
            return 'AB';
        case 'saskatchewan':
            return 'SK';
        case 'manitoba':
            return 'MB';
        case 'ontario':
            return 'ON';
        case 'new brunswick':
            return 'NB';
        case 'nova scotia':
            return 'NS';
        case 'pei':
        case 'prince edward island':
            return 'PE';
        case 'newfoundland and labrador':
            return 'NL';
        case 'yukon':
            return 'YT';
        case 'northwest territories':
            return 'NT';
        case 'nunavut':
            return 'NU';
        case 'repatriated':
        case 'repatriated travellers':
            return 'Repatriated';
        case 'quebec':
            return 'QC';
        default:
            return name;
    }
};

/**
 * Normalized Province Name
 * @param province
 * @returns {string|boolean|*}
 * @private
 */
const normalizeProvince = (province = '') => {
    if (!_.isString(province) || _.isEmpty(province)) {
        return province;
    }

    // It exists in the valid long names, use it
    if (_.includes(validShortNames, province)) return reverseFormatCanadianProvinces(province);
    if (_.includes(validLongNames, province)) return province;

    return false;
};

module.exports = { formatCanadianProvinces, reverseFormatCanadianProvinces, validShortNames, validLongNames, normalizeProvince };
