const c = require('irc-colors');
const _ = require('lodash');

// Misc Icons
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

// Misc Logos
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

// Return Green color number for numbers less then 50
// Return Red color number for numbers over 50
// Return Blue color number for number at 50
const colorNumber = num => {
    if (!_.isSafeInteger(num)) {
        num = _.parseInt(num);
        if (!_.isSafeInteger(num)) return num;
    }
    if (num > 50) return c.green(num);
    if (num < 50) return c.red(num);
    return c.blue(num);
};

// Red negative, blue 0, green positive
const colorSignedNumber = num => {
    if (!_.isSafeInteger(num)) {
        num = _.parseInt(num);
        if (!_.isSafeInteger(num)) return num;
    }
    if (num > 0) return c.green(num);
    if (num < 50) return c.red(num);
    return c.blue(num);
}

// IRC Title line, Bold
const title = text => c.bold(text);

// String Builder
class StringBuilder {
    // Build with options object
    constructor(options = Object.create(null)) {
        // Initialize buffer
        this.buffer = '';

        // Establish divider
        options.divider = !_.isUndefined(options.divider) && _.isString(options.divider) ? options.divider : icons.sideArrow;

        // We have an options object
        if (_.isObject(options) && !_.isEmpty(options)) {
            // We have been provided with an initial logo
            if (!_.isUndefined(options.logo) && _.isString(options.logo) && _.has(logos, options.logo)) this.buffer = `${logos[options.logo]} ${icons.sideArrow}`;
        }

        // Set the options
        this.options = options;

    };
    // Append to Buffer
    append(text) {
        if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) return this;
        this.buffer = _.isEmpty(this.buffer) ? text : `${this.buffer} ${this.options.divider} ${text}`;
        return this;
    };
    // Append an icon
    appendIcon(icon) {
        if (!_.isUndefined(icon) && _.isString(icon) && !_isEmpty(string) && _.has(icons, icon)) this.buffer = `${this.buffer} ${icons[icon]}`;
        return this;
    };
    // Return the buffer
    toString() {
        return this.buffer.trim();
    }

    // Text Get accessor
    get text() {
        return this.toString();
    }
    set text(input) {
        return this.append(input);
    }
};


// Exports
module.exports = {
    logos,
    icons,
    title,
    colorNumber,
    colorSignedNumber,
    StringBuilder
};
