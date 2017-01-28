'use strict';
const c = require('irc-colors');
const _ = require('lodash');
require('lodash-addons');

// Misc Icons
const icons = {
    upArrow: c.green.bold('↑'),
    downArrow: c.red.bold('↓'),
    views: c.navy.bold('⚘'),
    comments: c.blue.bold('✍'),
    sideArrow: '→',
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
    chuckNorris: c.yellow.bold('Chuck Norris'),
    m2m: c.yellow.bold('Apocolypse Clock'),
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
        // Initialize options
        this._buildOptions(options);
    };
    // Build the options
    _buildOptions(options) {
        // Should we disable color
        options.disableColor = _.getBoolean(_.get(options, 'disableColor'), false);

        // Establish divider
        options.divider = _.getString(_.get(options, 'divider'), (options.disableColor ? c.stripColors(icons.sideArrow) : icons.sideArrow));

        // Initialize buffer with optional Logo
        this.buffer = _.isUndefined(options.logo) || !_.isString(options.logo) || !_.has(logos, options.logo) ? '' : `${logos[options.logo]}`;

        // Set the options
        this.options = options;
    };
    // Append to Buffer
    append(text) {
        // No text detected
        if (!_.isString(text) || _.isEmpty(text)) return this;
        this.buffer = !_.isString(this.buffer) || _.isEmpty(this.buffer) ? `${text} ${this.options.divider}` : `${this.buffer} ${text} ${this.options.divider}`;
        return this;
    };
    // Prepend text to buffer
    prepend(text) {
        if (!_.isString(text) || _.isEmpty(text)) return this;
        this.buffer = `${text} ${this.options.divider} ${this.buffer}`;
        return this;
    };
    // Insert into buffer
    insert(text, left = false) {
        if (!_.isString(text) || _.isEmpty(text)) return this;
        this.buffer = this.buffer + ' ' + text;
        return this;
    };
    // Append an icon
    insertIcon(icon, spaceBetween = true) {
        if (!_.isUndefined(icon) && _.isString(icon) && !_isEmpty(string) && _.has(icons, icon)) this.buffer = `${this.buffer}${spaceBetween ? ' ': ''}${icons[icon]}`;
        return this;
    };
    // Insert divider
    insertDivider(text) {
        return this.insert((text || this.options.divider));
    };
    // Append color number
    appendColorNumber(num, title) {
        if (!_.isEmpty(num)) return _.isString(title) && !_.isEmpty(title) ? `${title} ${this.append(colorNumber(num))}` : this.append(colorNumber(num));
        return this;
    };
    // Return color signed number
    appendColorSignedNumber(num, title) {
        if (!_.isEmpty(num)) return _.isString(title) && !_.isEmpty(title) ? `${title} ${this.append(colorSignedNumber(num))}` : this.append(colorSignedNumber(num));
        return this;
    };
    // Add a Title
    appendBold(text) {
        if (_.isString(text) && !_.isEmpty(text)) return this.append(c.bold(text));
        return this;
    };
    // Inert a title
    insertBold(text) {
        if (_.isString(text) && !_.isEmpty(text)) return this.insert(c.bold(text));
        return this;
    };
    // Return the buffer
    toString() {
        // Get a normalized buffer
        let outputBuffer = this.options.disableColor ? c.stripColors(this.buffer.trim()) : this.buffer.trim();
        // See if the divider is at the final spot, if so, remove it
        outputBuffer = outputBuffer.endsWith(this.options.divider) ? outputBuffer.substring(0, outputBuffer.length - this.options.divider.length) : outputBuffer;
        return outputBuffer.trim();
    };
    // Text Get accessor
    get text() {
        return this.toString();
    };
};


// Exports
module.exports = {
    logos,
    icons,
    title,
    colorNumber,
    colorSignedNumber,
    StringBuilder,
    c
};
