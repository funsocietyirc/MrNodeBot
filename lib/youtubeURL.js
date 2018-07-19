const youtubeRegexp = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
const timeRegexp = /t=(\d+)[ms]?(\d+)?s?/;

/**
 * get id from url
 * @param  {string} url url
 * @return {string}     id
 */
const getIdFromURL = (url) => {
    let id = url.replace(youtubeRegexp, '$1');

    if (id.includes(';')) {
        const pieces = id.split(';');

        if (pieces[1].includes('%')) {
            const uriComponent = decodeURIComponent(pieces[1]);
            id = ("http://youtube.com" + uriComponent).replace(youtubeRegexp, '$1');
        } else {
            id = pieces[0];
        }
    } else if (id.includes('#')) {
        id = id.split('#')[0];
    }

    return id
};

/**
 * get time from url
 * @param  {string} url url
 * @return {number}     time
 */
const getTimeFromURL = (url) => {
    if ( url === void 0 ) url = '';

    let times = url.match(timeRegexp);

    if (!times) {
        return 0
    }

    const full = times[0];
    let minutes = times[1];
    let seconds = times[2];

    if (typeof seconds !== 'undefined') {
        seconds = parseInt(seconds, 10);
        minutes = parseInt(minutes, 10);
    } else if (full.includes('m')) {
        minutes = parseInt(minutes, 10);
        seconds = 0;
    } else {
        seconds = parseInt(minutes, 10);
        minutes = 0;
    }

    return seconds + (minutes * 60)
};

module.exports = {
    getIdFromURL,
    getTimeFromURL,
    timeRegexp,
    youtubeRegexp
};
