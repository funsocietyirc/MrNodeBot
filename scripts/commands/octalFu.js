'use strict';
const scriptInfo = {
    name: 'octalfu',
    desc: 'IPv4 to Octal',
    createdBy: 'IronY'
};

module.exports = app => {
    app.Commands.set('hello', {
        desc: '[ipv4 Address] - Convert IPv4 to Octal',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {

        }
    });

    // Return the script info
    return scriptInfo;
};
