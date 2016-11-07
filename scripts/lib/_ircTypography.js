const c = require('irc-colors');

const icons = {
    upArrow: c.green.bold('↑'),
    downArrow: c.red.bold('↓'),
    views: c.navy.bold('⚘'),
    comments: c.blue.bold('✍'),
    sideArrow: c.grey.bold('→'),
    anchor: c.navy.bold('⚓'),
    star: c.yellow('✡'),
    happy: c.green.bold('☺'),
    sad: c.red.bold('☹'),
    time: c.grey.bold('@'),
};

const logos = {
    youTube: c.grey.bold('You') + c.red.bold('Tube'),
    gitHub: c.grey.bold('GitHub'),
    bitBucket: c.navy.bold('BitBucket'),
    imdb: c.brown.bold('IMDB'),
    fml: c.blue.bold('FML'),
    bofh: c.grey.bold('BOFH'),
    mrrobot: c.red.bold('#MrRobot'),
    twitter: c.blue.bold('Twitter'),
    lmgtfy: c.grey.bold('LMGTFY'),
    reddit: c.blue.bold('REDDIT'),
    imgur: c.green.bold('IMGUR'),
};

const colorNumber = num => {
  if(num > 50) return c.green(num);
  if(num < 50) return c.red(num);
  return c.blue(num);
};

const title = text => c.bold(text);

module.exports = {
  logos,
  icons,
  title,
  colorNumber
};
