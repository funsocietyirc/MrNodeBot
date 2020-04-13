const scriptInfo = {
    name: 'showImageLink',
    desc: 'Announce a Image link for the user triggering the command',
    createdBy: 'IronY',
};

module.exports = app => {
    if (!app.WebServer) return scriptInfo;

    /**
     * Images Handler
     * @param to
     */
    const imagesHandler = to => {
        if (!app.WebServer) return;
        const path = app.WebServer.namedRoutes.build('urls', {
            channel: to,
        });
        app.say(to, `You can view all images from ${to} at ${app.Config.express.address}${path}`);
    };
    app.Commands.set('images', {
        desc: 'Show users the link to images',
        access: app.Config.accessLevels.identified,
        call: imagesHandler,
    });
    return scriptInfo;
};
