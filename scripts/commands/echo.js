const scriptInfo = {
    name: 'echo',
    desc: 'Echo text back to the IRC user, a simple test script',
    createdBy: 'IronY',
};

module.exports = app => {
    /**
     * Echo Handler
     * @param to
     * @param from
     * @param text
     */
    const echoHandler = (to, from, text) => app.say(to, text);
    app.Commands.set('echo', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: echoHandler,
    });

    // Return the script info
    return scriptInfo;
};
