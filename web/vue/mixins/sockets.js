const sockets = {
    name: 'sockets',
    data() {
        return {
        };
    },
    methods: {
        initSocket: function () {
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
        }
    },
    mounted() {
        this.initSocket();
    }
};
module.exports = sockets;
