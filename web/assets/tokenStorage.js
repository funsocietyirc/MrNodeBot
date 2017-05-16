$(function () {
    // No Local storage found
    if (!typeof(Storage) === 'undefined') {
        return;
    }

    const form = $("#uploadForm");
    const token = $("#token");

    if (localStorage.getItem('token')) {
        token.val(localStorage.getItem('token'));
    }

    form.submit(function (event) {
        localStorage.setItem('token', token.val());
    });
});
