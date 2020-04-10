<template>
    <div>
        <!--Current Listener Stats-->
        <div v-if="uiVisible" id="stats">
            <h3 class="uk-display-inline uk-text-right uk-margin-small-right">
                MrNodeBot TV <i class="url uk-icon-justify uk-icon-users"
                                style="margin-right:10px; margin-left:10px;"></i>{{totalListeners}}
            </h3>
            <h3 class="uk-display-inline uk-text-right uk-margin-small-right">
                <span class="to">{{activeChannel}}</span>
                <i class="url uk-icon-justify uk-icon-users" style="margin-right:10px; margin-left:10px;"></i>{{channelListeners}}
            </h3>
        </div>
        <!--Channel List-->
        <div v-if="uiVisible" id="channels">
            <h4>
                <i class="uk-icon-fast-forward uk-margin-small-left uk-margin-small-right from"></i> Channels
            </h4>
            <div class="listContainer">
                <ul class="uk-list uk-list-line">
                    <!--suppress CommaExpressionJS -->
                    <li v-for="channel in channels">
                        <i class="url uk-icon-justify uk-icon-users" style="margin-right:10px; margin-left:10px;"></i>
                        <span class="uk-margin-small-right">{{channel.count}}</span>
                        <a v-bind:href="channelLink(channel.channel)"
                           class="uk-margin-small-right">{{channel.channel}}</a>
                    </li>
                </ul>
            </div>
        </div>
        <!--Controls-->
        <div id="controls" class="noselect">
            <a v-on:click="visibleButton" v-bind:class="ui"
               class="uk-icon-button uk-margin-small-right uk-display-inline-block"></a>
            <div v-if="uiVisible" class="uk-display-inline">
                <a v-on:click="likeButton"
                   class="uk-icon-button uk-icon-heart uk-margin-small-right uk-text-danger uk-display-inline-block"></a>
                <a v-on:click="muteButton" v-bind:class="muted"
                   class="uk-icon-button uk-margin-small-right uk-display-inline-block"></a>
                <vue-slider tooltip="hover" v-model="slider" width="200" class="uk-display-inline-block"
                            height="3"></vue-slider>
            </div>
        </div>
        <!--Now Playing Bar-->
        <div v-if="key && uiVisible" id="nowPlaying">
            <i class="uk-icon-play uk-margin-small-right from"></i> {{title}} <span class="from">
            <i class="uk-margin-small-right uk-margin-small-left uk-icon-user"></i>  {{from}}</span>
        </div>
        <!--Song Queue-->
        <div id="queue" v-if="queue.length > 0 && uiVisible">
            <h4>
                <i class="uk-icon-fast-forward uk-margin-small-right from"></i> Up Next
                <div class="uk-badge uk-badge-danger uk-margin-small-left">{{queue.length}}</div>
            </h4>
            <div class="listContainer">
                <ul class="uk-list uk-list-line">
                    <!--suppress CommaExpressionJS -->
                    <li v-for="(item, index) in queue">
                        <span class="timestamp uk-margin-small-right">{{index + 1}}</span> {{item.title}} <span
                            class="from uk-margin-small-left">{{item.from}}</span>
                    </li>
                </ul>
            </div>
        </div>
        <!--Youtube Player-->
        <div id="player" v-if="key" type="text/html" class="youtube-player"></div>
        <script src="https://www.youtube.com/iframe_api"></script>


        <youtube id="player" v-if="key" type="text/html" class="youtube-player" :player-width="windowWidth"
        :player-height="windowHeight" :video-id="key" :player-vars="playerVars" @paused="pause"
        @ready="ready" @playing="playing" @ended="ended"></youtube>


        <!--Background animation-->
        <div v-if="!key || paused">
            <div class="frame">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="image-layer"></div>
        </div>
    </div>
</template>

<style scoped>

    .noselect {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none;
        /* Non-prefixed version, currently
                                         supported by Chrome and Opera */
    }

    .from {
        text-shadow: 4px 4px 7px rgba(0, 0, 0, 0.79);
    }

    body,
    html {
        height: 100%;
        margin: 0;
    }

    #player {
        pointer-events: none;
    }

    #controls {
        position: fixed;
        left: 5px;
        bottom: 43px;
        height: 1.1em;
        padding: 5px;
        z-index: 5;
        width: 85%;
    }

    #nowPlaying {
        position: fixed;
        left: 0;
        width: 80%;
        height: 1.1em;
        padding: 5px;
        z-index: 5;
    }

    #stats {
        position: fixed;
        right: 5px;
        height: 1.1em;
        padding: 5px;
        z-index: 5;
    }

    #queue {
        position: fixed;
        top: 50%;
        right: 0;
        z-index: 5;
        width: 15%;
        height: 100%;
        background: #000;
        opacity: 0.7;
        color: #fff;
        padding: 5px;
        border-top-left-radius: 6px;
    }

    #channels {
        position: fixed;
        top: 50%;
        left: 0;
        z-index: 5;
        width: 15%;
        height: 70%;
        background: #000;
        opacity: 0.7;
        color: #fff;
        padding: 5px;
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;

    }

    .listContainer {
        height: 40%;
        width: 100%;
        overflow-y: auto;
    }

    ::-webkit-scrollbar-track {
        margin-top: 0;
    }

    /*noinspection CssUnknownTarget*/

    .image-layer {
        z-index: 1;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        color: transparent;
        background: url('/images/standby.jpg') no-repeat fixed center center;
        background-size: cover;
        text-shadow: 0 0 30px rgba(0, 0, 0, .5);
        animation: glitch 8s linear infinite;
        pointer-events: none;
    }

    .frame {
        z-index: 3;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 19%, rgba(0, 0, 0, 0.9) 100%);
        pointer-events: none;
    }

    .frame div {
        position: absolute;
        left: 0;
        top: -20%;
        width: 100%;
        height: 20%;
        background-color: rgba(0, 0, 0, .12);
        box-shadow: 0 0 10px rgba(0, 0, 0, .3);
        animation: waves 12s linear infinite;
    }

    .frame div:nth-child(1) {
        animation-delay: 0s;
    }

    .frame div:nth-child(2) {
        animation-delay: 4s;
    }

    .frame div:nth-child(3) {
        animation-delay: 8s;
    }

    @keyframes waves {
        0% {
            top: -20%;
        }
        100% {
            top: 100%;
        }
    }

    @keyframes glitch {
        0% {
            opacity: .4;
        }
        10% {
            opacity: .2;
        }
        20% {
            opacity: .3;
        }
        30% {
            opacity: .1;
        }
        40% {
            opacity: .2;
        }
        50% {
            opacity: .2;
        }
        54% {
            opacity: .4;
        }
        58% {
            opacity: .2;
        }
        60% {
            opacity: .2;
        }
        65% {
            opacity: .3;
        }
        70% {
            opacity: .2;
        }
        80% {
            opacity: .2;
        }
        90% {
            opacity: .3;
        }
        93% {
            opacity: .4;
        }
        96% {
            opacity: .2;
        }
        100% {
            opacity: .3;
        }
    }
</style>
<script>
    export default {
        // Initial Data Structure
        data() {
            return {
                key: '', // Current Video
                seekTime: 0, // Current Seek Time
                from: '', // Current Video sent From Nick
                to: '', // Current Video sent to channel
                title: '', // Current Video title
                timestamp: null, // Time current video was received
                initialTime: null, // Current Hardware timestamp
                paused: false, // Player pause status
                queue: [], // Video Queue
                firstLoad: true, // Has a video been loaded yet?
                synced: false, // We have been synced with the rest of the clients
                syncedTime: null, // initial Sync Time
                // activeChannel: '', // Active channel, defaults to ''
                windowHeight: 0, // Browser Window Height
                windowWidth: 0, // Browser Window Width
                totalListeners: 1, // Current Total Listeners, defaulted to 1
                channelListeners: 1, // Current Channel Total Listeners, defaulted to 1,
                slider: 50,
                originalVolume: 50,
                channel: null, // Socket Connection,
                channels: {}, // Channels available
                uiVisible: true, // User Interface Visibility
                player: null,
            }
        },
        // Computed Properties
        computed: {
            playerVars: function () {
                return {
                    autoplay: 1,
                    start: this.seekTime,
                    controls: 0,
                    modestBranding: 1,
                    disable: 1,
                    showinfo: 0,
                }
            },
            muted: function () {
                return this.slider === 0 ? 'uk-text-danger uk-icon-volume-off' : 'uk-text-success uk-icon-volume-up';
            },
            ui: function () {
                return this.uiVisible ? 'uk-icon-eye' : 'uk-icon-eye-slash';
            }
        },
        // On Component mount
        mounted() {
            const self = this;
            self.windowWidth = window.innerWidth;
            self.windowHeight = window.innerHeight;

            // Initialize Primary logic
            this.$nextTick(function () {

                window.stopVideo = () => {
                    self.player.stopVideo();
                };

                // Bind the youtube Iframe handler
                window.onYouTubeIframeAPIReady = () => {
                    self.player = new YT.Player('player', {
                        height: self.windowHeight,
                        width: self.windowWidth,
                        events: {
                            onReady: (event) => this.ready(event.target),
                            onStateChange: function (event) {
                                if (event.data !== -1) {
                                    // this$1.$emit(container.events[event.data], event.target);
                                }
                            },
                            onError: function (event) {
                                // this$1.$emit('error', event.target);
                            }
                        }
                    });
                };

                //  Initialize Socket
                this.initSocket();

                // Bind window resize logic
                window.addEventListener('resize', () => {
                    self.windowWidth = window.innerWidth;
                    self.windowHeight = window.innerHeight;
                    if (self.player && self.key) {
                        self.player.setSize(window.innerWidth, window.innerHeight);
                    }
                });
            });
        },
        components: {
            youtube: require('./youtubeplayer')
        },
        // Watched Properties
        watch: {
            // Modify the page Title
            title: function (val) {
                const out = val === '' ? 'Fsociety TV' : val;
            },
            // Bind the volume slider to the youtube player
            slider: function (val) {
                if (this.player) this.player.setVolume(val);
            },

        },
        // Vue Methods
        methods: {
            // Channel link
            channelLink: function (chan) {
                // Lobby
                if (chan === 'Lobby') return laroute.route('watch-youtube');
                // Normal Channel
                return window.location.href + '?activeChannel=' + escape(chan);
            },
            // Fire off like button event
            likeButton: function () {
                this.channel.emit('like');
            },
            visibleButton: function () {
                this.uiVisible = !this.uiVisible;
            },
            muteButton: function () {
                if (this.slider === 0) {
                    this.slider = this.originalVolume;
                } else {
                    this.originalVolume = this.slider;
                    this.slider = 0;
                }
            },
            // Youtube player is playing
            playing: function () {
                this.paused = false;
            },
            // Youtube player is ready
            ready: function (player) {
                // Hold on to the player object
                this.player = player;

                // // Hack to have the first synced song seeked to the appropriate time
                if (this.firstLoad) {
                    if (this.seekTime !== null) {
                        // player.seekTo(parseFloat(this.seekTime), true);
                        player.loadVideoById(this.key, parseFloat(this.seekTime), "large")
                    }
                    this.firstLoad = false;
                }
                // Set Default volume
                player.setVolume(this.slider);
            },
            // Youtube player is paused
            pause: function () {
                this.paused = true;
            },
            // Youtube video has ended
            ended: function () {
                // Reset the key
                this.clearNowPlaying();
                // There are still items left in the queue
                if (this.queue.length > 0) {
                    // Pop the first item off
                    const item = this.queue.splice(0, 1)[0];

                    this.seekTime = item.seekTime;
                    this.key = item.key;
                    this.timestamp = item.timestamp;
                    this.title = item.title;
                    this.from = item.from;
                    this.to = item.to;

                    // Notify
                    this.notifyPlay('Playing', this);
                }
            },
            speak: function (message) {
                // No Message
                if (!message || message === '') return;
                if (!window.speechSynthesis || !window.speechSynthesis.speak || !SpeechSynthesisUtterance) {
                    this.notifyPlay(message);
                } else {
                    const toSay = new SpeechSynthesisUtterance(message);
                    window.speechSynthesis.speak(toSay);
                }
            },
            // Wrapper around UIkits notify, notify on an item (including this)
            notifyPlay: function (message, item) {
                // Required Items are missing
                if (!message) return;

                UIkit.notify({
                    message: (item && item.from && item.to && item.title) ?
                        `<div class="uk-text-center"><h1>${message}</h1><h2>${item.title}</h2><h3>${item.from}</h3></div>` : `<h1 class="uk-text-center">${message}</h1>`,
                    status: 'info',
                    timeout: 4000,
                    pos: 'bottom-center'
                });
            },
            // Build a queue item
            queueItem: function (key, from, to, timestamp, title, seekTime) {
                title = title || '';
                return {
                    key,
                    from,
                    to,
                    timestamp,
                    title,
                    seekTime
                };
            },
            // Clear the queue
            clearQueue: function () {
                this.queue.splice(0);
            },
            // Clear the current playing video
            clearNowPlaying: function () {
                this.key = '';
                this.from = '';
                this.to = '';
                this.title = '';
                this.seekTime = '';
                this.timestamp = null;
                this.paused = false;
            },
            // Build a state for this client
            buildState: function () {
                const currentState = {
                    key: this.key,
                    from: this.from,
                    to: this.to,
                    title: this.title,
                    seekTime: this.player && _.isFunction(this.player.getCurrentTime) ? this.player.getCurrentTime() : 0,
                    timestamp: this.timestamp,
                    initialTime: this.initialTime,
                };

                // Create a copy of the current queue
                // TODO Replace with object.assign?
                const queue = JSON.parse(JSON.stringify(this.queue));

                // Put the current state at the start
                queue.unshift(currentState);

                // Return state
                return {
                    initialTime: this.initialTime,
                    activeChannel: this.activeChannel,
                    queue: queue,
                };
            },
            initSocket: function () {
                const self = this;

                // Subscribe to webSocket
                const channel = this.channel = io.connect('/youtube', {
                    query: `activeChannel=${this.activeChannel}`
                });

                // YouTube new Connection event
                channel.on('new', data => {

                    // Modify state
                    self.totalListeners = data.totalListeners;
                    self.channelListeners = data.channelListeners;
                    self.channels = data.channels || {};

                    // If we have a HR Time broadcast our state
                    if (self.initialTime) channel.emit('new-reply', self.buildState());
                });


                // Respond to the like event
                channel.on('like', () => UIkit.notify(`<div class="uk-text-center from"><i class="uk-icon-heartbeat uk-margin-small-right"></i> Someone Likes This!</div>`, {
                    timeout: 1000,
                    pos: 'bottom-center'
                }));

                // Listen for Disconnects
                channel.on('left', data => {
                    // Modify state
                    self.totalListeners = data.totalListeners;
                    self.channelListeners = data.channelListeners;
                    self.channels = data.channels || {};
                });

                // Speak
                channel.on('speak', data => self.speak(data));

                // Handle Queue Sync
                channel.on('queue', data => {
                    // If we do not have an HR time or if the current one is older then ours
                    if (
                        //!self.initialTime || // We have an Initial HR Time
                        (!self.syncedTime ||
                            self.syncedTime > data.initialTime
                        ) &&
                        (
                            data && // We Have Data
                            data.initialTime && // The State has an Initial Time
                            self.initialTime > data.initialTime // Ours is newer
                        )
                    ) {
                        // Hold on to the initial Synced time
                        self.syncedTime = data.initialTime;
                        // Clear Current State
                        self.clearNowPlaying();
                        self.clearQueue();
                        // Pop off first item
                        const item = data.queue.splice(0, 1)[0];
                        // Figure out time shift?
                        // Super magic experimental number
                        const timeshift = 0.2; //1.255;
                        // Set First Item
                        self.seekTime = item.seekTime + timeshift;
                        self.key = item.key;
                        self.timestamp = item.timestamp;
                        self.title = item.title;
                        self.from = item.from;
                        self.to = item.to;
                        self.initialTime = item.timestamp;
                        // Notify
                        if (!self.synced) self.notifyPlay('Synced', self);
                        self.synced = true;
                        // Assign the rest of the queue to the clients
                        self.queue = data.queue;
                    }
                });

                // Time Sync
                channel.on('timesync', data => {
                    self.initialTime = data;
                });

                // YouTube Control Channel
                channel.on('control', data => {
                    // Gate
                    if (!data.command) return;

                    // Switch Control commands
                    switch (data.command) {
                        // Clear current queue
                        case 'clear':
                            self.clearNowPlaying();
                            self.clearQueue();
                            break;
                        // Remove item from queue
                        case 'remove':
                            if (data.index > self.queue.length || data.index - 1 < 0) return;
                            self.queue.splice(data.index - 1, 1);
                            break;
                        // Reload Page
                        case 'reload':
                            location.reload();
                            break;
                        case 'speak':
                            self.speak(data.message);
                            break;
                        case 'skip':
                            if (_.isEmpty(self.queue)) return;
                            // Pop off first item
                            const item = self.queue.splice(0, 1)[0];
                            // Adjust the state
                            self.seekTime = item.seekTime;
                            self.key = item.key;
                            self.timestamp = item.timestamp;
                            self.title = item.title;
                            self.from = item.from;
                            self.to = item.to;
                            // Notify
                            self.notifyPlay('Skipping to play', item);
                    }
                });

                // YouTube Broadcast channel
                channel.on('message', data => {
                    // No Key, Same key as currently playing, bail
                    if (!data.video ||
                        !data.video.key ||
                        data.video.key === self.key ||
                        _.find(self.queue, {
                            key: data.video.key
                        })
                    ) return;

                    // Create the item
                    const item = self.queueItem(
                        data.video.key,
                        data.from,
                        data.to,
                        data.timestamp,
                        data.video.videoTitle,
                        data.seekTime
                    );

                    // If we for some reason do not have an initial HR time, set it baseed on thee current track
                    if (!self.initialTime) self.initialTime = data.timestamp;

                    // Add Item To queue
                    self.queue.push(item);

                    // If nothing is currently playing, process the item
                    if (self.key === '') {
                        // Pop the first item from the queue
                        const currentItem = self.queue.splice(0, 1)[0];
                        self.seekTime = currentItem.seekTime;
                        self.key = currentItem.key;
                        self.timestamp = currentItem.timestamp;
                        self.title = currentItem.title;
                        self.from = currentItem.from;
                        self.to = currentItem.to;
                        self.notifyPlay('Playing', self);
                    }

                    // Otherwise Notify we are adding it
                    else self.notifyPlay('Adding', item);
                });
            }
        }
    }
</script>
