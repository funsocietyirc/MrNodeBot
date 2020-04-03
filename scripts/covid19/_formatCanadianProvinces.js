/**
 * Format Names
 * @param name
 * @returns {string}
 */
const formatCanadianProvinces = (name) => {
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

module.exports = formatCanadianProvinces;
