'use strict';
const scriptInfo = {
    name: 'stylize',
    file: 'stylize.js',
    createdBy: 'Dave Richer'
};

const color = require('irc-colors');

/**
  Allow the bot to talk to a channel/privmesg in technocolor
  Commands: styleize [[Channel][Style][Message]]
**/
module.exports = app => {
    // Handler
    const stylize = (to, from, text, message) => {
        let txtArray = text.split(' '),
            chan = txtArray[0],
            style = txtArray[1];
        txtArray.splice(0, 2);
        let output = txtArray.join(' ');

        // Quit if no argument
        if (chan.isEmpty() || style.isEmpty()) {
            app.say(to, "You must specify a channel name as the first argument and a style as the second");
            return;
        }

        // Quit if not on the channel
        if (!app._ircClient.chans[chan]) {
            app.say(to, `I am not on channel ${chan}`);
            return;
        }

        // List of valid styles
        const validStyles = [
            'zebra', 'rainbow', 'america', 'shit', 'pipboy'
        ];

        let proc = 0, x;

        switch (style) {
            case 'zebra':
                for (x = 1; x < output.length; x++) {
                    proc += x % 2 === 0 ? color.black.bgwhite(output[x]) : color.white.bgblack(output[x]);
                }
                break;
            case 'rainbow':
                proc = color.rainbow(output);
                break;
            case 'america':
                proc = color.rainbow(output, [
                    'red', 'white', 'blue'
                ]);
                break;
            case 'shit':
                proc = color.lime.bgbrown(output);
                break;
            case 'pipboy':
                proc = color.lime.bggray(output);
                break;
            default:
                app.say(from, `${style} is not a valid style, please try ${validStyles.join(',')}`);
                return;
        }
        app.say(chan, proc);
    };

    app.Commands.set('stylize', {
        desc: '[Channel] [Style] [Message] - Formats a message and sends it to the specified channel',
        access: app.Config.accessLevels.admin,
        call: stylize
    });

    // Return the script info
    return scriptInfo;
};
