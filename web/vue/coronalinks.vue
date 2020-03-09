<template>
    <div class="uk-grid">
        <div id="navBar" class="uk-width-large-1-10 uk-width-medium-2-10">
            <h1 class="uk-text-medium uk-text-center uk-margin-top uk-text-truncate">{{searchText || 'Links' | uppercase}}</h1>
            <div class="innerNavBar">
                <transition name="fade" appear>
                    <table class="uk-table uk-table-condensed uk-margin-bottom">
                        <thead>
                        <tr>
                            <th>Last 20 Nicks</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-bind:class="{ 'currentSearch': isActiveSearch(result) }" v-for="result in from">
                            <td v-bind:data-from="result" class="from clickable" @click="updateFilter(result)">{{result}}</td>
                        </tr>
                        </tbody>
                    </table>
                </transition>
            </div>
            <div class="uk-width-1-1 clear-div">
                <transition name="slide-fade">
                    <button v-show="searchText" class="uk-btn clearFilterButton uk-width-1-1" @click="updateFilter('')">
                        Clear
                    </button>
                </transition>
            </div>
        </div>
        <div class="uk-width-large-9-10 uk-width-small-8-10">
            <div id="linkTableOverflow" class="uk-overflow-container">
                <table id="linkTable" class="uk-table uk-table-striped uk-table-condensed uk-margin-top">
                    <thead>
                    <tr>
                        <th>To</th>
                        <th>From</th>
                        <th>URL</th>
                        <th>Timestamp</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-bind:data-timestamp="result.timestamp" v-for="result in resultSet">
                        <td class="to uk-width-1-6 clickable">{{result.to}}</td>
                        <td class="from uk-width-1-6 clickable" @click="updateFilter(result.from)">{{result.from}}</td>
                        <td class="url uk-width-3-6">
                            <a data-uk-tooltip @click="linkClicked(result, $event)"
                               :title="result.title">{{result.url}}</a>
                        </td>
                        <td class="timeStamp uk-width-1-6">{{result.timestamp | date("%D %R")}}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<style>
    .clear-div {
        padding: 0 5px;
    }

    .clearFilterButton {
        background: black;
    }

    .clickable {
        cursor: pointer;
    }

    .clickable:hover,
    .clickable:active {
        color: white;
    }

    .currentSearch {
        background: rgba(245, 245, 245, 0.1);
    }

    .new {
        background-color: rgba(60, 210, 24, 0.2) !important;
        transition: all 1s linear;
    }

    .innerNavBar {
        padding-top: 15px;
        padding-bottom: 5px;
    }

    #linkTableOverflow {
    }

    #linkTable > tbody > tr:first-child,
    #linkTable > tbody > tr:last-child {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
    }
</style>
<script>

    const _ = require('lodash');

    export default {
        filters: {
            uppercase: function (value) {
                if (!value) return;
                return _.toUpper(value);
            },
            toLowerCase: function (value) {
                if (!value) return;
                return _.toLower(value);
            },
        },
        data: function () {
            return {
                results: [],
                to: [],
                from: [],
                searchText: '',
            }
        },
        mounted() {
            $('footer').detach();
            this.searchText = '';
            this.fetchData();
            this.initSocket();
        },
        computed: {
            resultSet: function () {
                if (_.isEmpty(this.results)) return [];
                return this.customFilter(this.results, this.searchText, 'in', 'from', 'to');
            },
        },
        watch: {
            results: function (val, oldVal) {
                let to = _(val).map('to').uniq().take(25).value();
                let from = _(val).map('from').uniq().take(20).value();
                this.to = to;
                this.from = from;
            }
        },
        methods: {
            customFilter:  (array, needle, inKeyword, key, key2) => _.filter(array, item => needle === '' || _.toLower(item[key]) === _.toLower(needle) || _.toLower(item[key2]) === _.toLower(needle)),
            linkClicked: function (link, event) {
                if (
                    link.url.startsWith('https://youtu.be') ||
                    link.url.startsWith('https://www.youtube.com/watch?') ||
                    link.url.endsWith('.jpg') ||
                    link.url.endsWith('.png') ||
                    link.url.endsWith('.gif') ||
                    link.url.endsWith('.jpeg') ||
                    link.url.endsWith('.webm') ||
                    link.url.endsWith('.mp4')
                ) {
                    let lb = window.UIkit.lightbox;
                    lb.create([{
                        source: link.url,
                        title: link.title,
                        keyboard: false,
                    }]).show();
                } else {
                    window.open(link.url, '_blank');
                }
            },
            isActiveSearch: function (val) {
                return val === this.searchText;
            },
            updateFilter: function (val) {
                this.searchText = this.searchText === val ? '' : val;
                this.$nextTick(function () {
                    $('#linkTable').trigger('display.uk.check');
                });
            },
            fetchData: function () {
                let vm = this;
                fetch('/api/urls?channel=%23coronavirus&pageSize=100').then(response => response.json()).then( (data) => {
                    vm.results = data.results;
                }).catch(e => {
                    // TODO handle this
                    console.log(e);
                });
            },
            socketHandler: function (data) {
                let self = this;
                self.results.unshift(data);
                self.$nextTick(function () {
                    let element = $('#linkTable').find("[data-timestamp='" + data.timestamp + "']");
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
        }
    }
</script>
