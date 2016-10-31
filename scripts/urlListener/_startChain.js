'use strict';

module.exports = (url,to,from,text,message,is) => new Promise((resolve, reject) => {
    if (!url || !to || !from || !text || !message) {
        reject({
            message: 'You are missing a required argument'
        });
        return;
    }
    resolve({
        url: url.startsWith('http') ? url : `http://${url}`,
        to,
        from,
        text,
        message,
        is,
        delivered: [],
        secure: url.startsWith('https://'),
        history: [],
    });
});
