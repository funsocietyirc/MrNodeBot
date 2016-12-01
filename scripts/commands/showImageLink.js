'use strict';

const scriptInfo = {
    name: 'showImageLink',
    desc: 'Announce a Image link for the user triggering the command',
    createdBy: 'IronY'
};

module.exports = app => {
    app.Commands.set('images', {
        desc: 'Show users the link to images',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            if (!app.WebServer) return;
            let path = app.WebServer.namedRoutes.build('urls', {
                channel: to
            });
            app.say(to, `You can view all images from ${to} at ${ app.Config.express.address}${path}`);
        }
    });
    return scriptInfo;
};
