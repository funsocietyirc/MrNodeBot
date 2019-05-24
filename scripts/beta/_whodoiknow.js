const scriptInfo = {
    name: 'whodoiknow',
    desc: 'Join a channel, determine who the bot has seen before',
    createdBy: 'IronY',
};

module.exports = (app) => {
    const getChannelData = async (channel) => {
        if(app._ircClient.isInChannel(channel)) {
            return app._ircClient._getChannelData(channel);
        }
    };

    // Handler
    const whodoiknow = async (to, from, text, message) => {
        // Isolate channel name (Use the first word of the message)
        const channel = message.split(' ')[0].trim();
        // Channel is empty or invalid
        if(!channel || !app._ircClient.isChannel(channel)) {
            app.say(to, `You need to give me a valid channel to work with, ${from}`);
            return;
        }

        const results = await getChannelData();

        console.dir(results);
        // Find out if you already in channel, if is, get channel list
        //const channelList = app._ircClient.isInChannel(subscription.attributes.channel, app.nick) ?

        // If not in channel, join channel, get channel list
        // do a databaselookup to see if any of the nicks or hosts match up to previous entries
        // report back
    };

    // app.Commands.set('whodoiknow', {
    //     desc: '[channel] find out who you know in a channel',
    //     access: app.Config.accessLevels.admin,
    //     call: whodoiknow,
    // });

    // Return the script info
    return scriptInfo;
};
