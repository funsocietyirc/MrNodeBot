const sockets = {
    name: 'sockets',
    props: {
    },
    computed: {
    },
    data() {
        return {
        };
    },
    methods: {
        socketHandler: function (data) {
            let self = this;
            // Filter out inappropriate messages
            if (
                !_.isObject(self.query) ||
                _.isEmpty(self.query) ||
                !self.query.hasOwnProperty('channels') ||
                self.query.channels.trim().toLowerCase().split(',').includes(data.to.toLowerCase())
            ) {
                const newData = Object.assign({}, data, {
                    timestamp: moment(data.timestamp).format("YYYY-MM-DD HH:mm:ss")
                });
                self.results.unshift(newData);
                self.$nextTick(function () {
                    let element = $('#linkTable').find("[data-timestamp='" + newData.timestamp + "']");
                    let navBar = $('#navBar');
                    let to = navBar.find("[data-to='" + data.to + "']");
                    let from = navBar.find("[data-from='" + data.from + "']");
                    element.addClass('new');
                    to.addClass('new');
                    from.addClass('new');
                    setTimeout(function () {
                        element.removeClass('new');
                        to.removeClass('new');
                        from.removeClass('new');
                    }, 5000);
                });
            }
        },
        initSocket: function () {
            let self = this;
            this.socket = io.connect();

            // // Announcements
            this.socket.on('announce', data => {
                if (!data) return;
                UIkit.notify({
                    message: `<div class="uk-text-center"><h4>Announcement From ${data.from}</h4><p>${data.text}</p></div>`,
                    status: 'info',
                    timeout: 7500,
                    pos: 'bottom-right'
                });
            });
            // // Tweets
            this.socket.on('tweets', data => {
                if (!data) return;
                UIkit.notify({
                    message: `[Twitter] @${data.tweet.user.screen_name}: ${data.tweet.text}`,
                    status: 'success',
                    timeout: 7500,
                    pos: 'bottom-left'
                });
            });

            this.socket.on('url', self.socketHandler);
            this.socket.on('image', self.socketHandler);
        }
    },
    mounted() {
        this.initSocket();
    }
};
module.exports = sockets;
