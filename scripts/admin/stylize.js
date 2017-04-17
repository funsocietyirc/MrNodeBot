'use strict';
const scriptInfo = {
  name: 'stylize',
  desc: 'Super colorized version of tell',
  createdBy: 'IronY'
};
const color = require('irc-colors');
const _ = require('lodash');

// Allow the bot to talk to a channel/privmesg in technocolor
// Commands: styleize [[Channel][Style][Message]]
module.exports = app => {
  // Handler
  const stylize = (to, from, text, message) => {
    let txtArray = text.split(' ');
    let [chan, style] = txtArray;
    // Quit if no argument
    if (!chan || !style) {
      app.say(to, "You must specify a channel name as the first argument and a style as the second");
      return;
    }

    let output = _.without(txtArray, chan, style).join(' ');

    // Quit if not on the channel
    if (!app._ircClient.isInChannel(chan)) {
      app.say(to, `I am not on channel ${chan}`);
      return;
    }

    // List of valid styles
    const validStyles = [
      'zebra', 'rainbow', 'america', 'shit', 'pipboy', 'mrrobot'
    ];

    let proc = '',
      x;

    switch (style) {
      case 'zebra':
        for (x = 0; x < output.length; x++) {
          proc += (x === 0 || x % 2 === 0) ? color.black.bgwhite(output[x]) : color.white.bgblack(output[x]);
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
      case 'mrrobot':
        proc = color.red.bgblack(output);
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
