// Thanks To Foxboron @ Freenode for the original Logic
'use strict';
// Ascii Module shims
const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digits = '0123456789';

// Default for number of channels seeded
const initialSeed = '7Q_9RnPjm';
const prefix = 'da';
const ircChannelPrefix = '#';

// Shift the Indices
const shift = (letter, dic) => dic[dic.indexOf(letter) + 1] ? dic[dic.indexOf(letter) + 1] : dic[0];

const fn = l => {
    // Nothing to see here
    if (l == '_') return l;
    // Letter is in fact not a letter at all
    if (!isNaN(l)) return shift(l, digits);
    // Letter is upercase
    if (l == l.toUpperCase()) return shift(l, upperCaseLetters);
    // Letter is lowercase
    if (l == l.toLowerCase()) return shift(l, lowerCaseLetters);
};

// Return a channel name
const channel = seed => {
    let string = '';
    // Iterate over the seed length and get a channel name
    for (var i = 0, len = seed.length; i < len; i++) string = string + fn(seed[i]);
    return string;
};

// Return an array of channels (exported function)
const channels = total => {
    let output = [],
        seed = channel(initialSeed);
    for (var x = 0; x < total; x++) {
        output.push(ircChannelPrefix + prefix + seed);
        seed = channel(seed);
    }
    return output;
};

module.exports = channels;
