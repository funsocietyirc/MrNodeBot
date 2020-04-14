<template>
    <div>
        <sitenav></sitenav>
        <div v-show="!loaded">
            <h2>Loading....</h2>
        </div>
        <div v-show="loaded" class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">Channel Usage Statistics</h1>
            </header>
            <hr class="uk-width-1-1 uk-margin-bottom">
            <div v-for="(result, key) in sortedResults"
                 class="uk-panel uk-panel-header uk-panel-box uk-width-large-1-3 uk-width-medium-1-1 uk-width-small-1-1">
                <div title="Messages Recorded, click for Overall usage summary" data-uk-tooltip
                     class="uk-panel-badge uk-badge">
                    <a :href="getActionLink(result.channel)">{{numberWithCommas(result.messages)}}</a>
                </div>
                <h3 class="uk-panel-title">
                    <i data-uk-tooltip v-bind:class="{ watched: result.isWatching, primaryColorText: !result.isWatching }"
                       :title="result.isWatching ? 'Joined' : 'Not Joined' " class="uk-icon-small uk-icon-hashtag"
                       style="margin-right:10px;"></i><span :title="getTitle(result)" data-uk-tooltip
                                                            class="to">{{result.channel}}</span>
                </h3>
                <!-- Statistics Flex -->
                <div class="uk-flex uk-flex-space-between  uk-flex-wrap-space-between activeUsers">
                    <div v-if="result.currentOps.length" data-uk-tooltip title="Operators">
                        {{result.currentOps.length}} <i class="uk-icon-at url uk-icon-justify"></i>
                    </div>
                    <div v-if="result.currentVoices.length" data-uk-tooltip title="Voiced Users">
                        {{result.currentVoices.length}} <i class="uk-icon-plus timeStamp uk-icon-justify"></i>
                    </div>
                    <div v-if="result.currentParticipants.length" data-uk-tooltip title="Regular Users">
                        {{result.currentParticipants.length}} <i class="uk-icon-user from uk-icon-justify"></i>
                    </div>
                    <div v-if="result.currentParticipants.length || result.currentOps.length || result.currentVoices.length"
                         data-uk-tooltip title="Total Online">
                        {{result.currentParticipants.length + result.currentOps.length + result.currentVoices.length}} <i
                            class="uk-icon-male white uk-icon-justify"></i>
                    </div>
                    <div v-if="result.popularityRanking" data-uk-tooltip title="Popularity Ranking">
                        {{result.popularityRanking.meanScore || 0.00}} <i
                            class="uk-icon-smile-o yellow uk-icon-justify"></i>
                    </div>
                    <div v-if="result.popularityRanking" data-uk-tooltip title="Total Votes">
                        {{result.popularityRanking.totalVotes || 0}} <i
                            class="uk-icon-envelope-o white uk-icon-justify"></i>
                    </div>
                    <div v-if="result.kicks" data-uk-tooltip title="Kicks">
                        {{result.kicks}} <i class="uk-icon-bomb uk-icon-justify"></i>
                    </div>
                    <div v-if="result.actions" data-uk-tooltip title="Actions">
                        {{result.actions}} <i class="uk-icon-check green uk-icon-justify"></i>
                    </div>
                    <div v-if="result.topMonthlyParticipants.length" data-uk-tooltip title="Most Active User this Month">
                        <a :href="getActionLink(result.channel, getMostActive(result))">{{getMostActive(result)}} <i
                                class="uk-icon-plus-circle from uk-icon-justify"></i></a>
                    </div>
                    <div v-if="result.popularityRanking" data-uk-tooltip title="Most Popular User">
                        <a :href="getActionLink(result.channel, getMostPop(result))">{{getMostPop(result)}} <i
                                class="uk-icon-graduation-cap white uk-icon-justify"></i></a>
                    </div>
                </div>
                <hr v-if="displayBar(result)">
                <div class="uk-accordion" data-uk-accordion="{showfirst: false}">
                    <h3 class="uk-accordion-title primaryColorText" v-if="result.topMonthlyParticipants.length"><span
                            class="uk-icon-justify uk-icon-arrows-v"></span>Top {{result.topMonthlyParticipants.length}} Monthly Participants
                    </h3>
                    <div class="uk-accordion-content" v-if="result.topMonthlyParticipants.length">
                        <table class="uk-table uk-table-striped">
                            <thead>
                            <tr>
                                <th class="primaryColorText">User</th>
                                <th class="primaryColorText">Messages</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="user in result.topMonthlyParticipants">
                                <td><a :href="getActionLink(result.channel, user.nick)">{{user.nick}}</a></td>
                                <td>{{numberWithCommas(user.total)}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <h3 class="uk-accordion-title primaryColorText" v-if="result.popularityRanking"><span
                            class="uk-icon-justify uk-icon-arrows-v"></span>Popularity</h3>
                    <div class="uk-accordion-content" v-if="result.popularityRanking">
                        <table class="uk-table uk-table-striped">
                            <thead>
                            <tr>
                                <th class="primaryColorText">Candidate</th>
                                <th class="primaryColorText">Score</th>
                                <th class="primaryColorText">Votes</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="candidate in result.popularityRanking.rankings">
                                <td>
                                    <a :href="getActionLink(result.channel, candidate.candidate)">{{candidate.candidate}}</a>
                                </td>
                                <td v-bind:class="{ red: candidate.score < 0, green: candidate.score > 0, gray: !candidate.score }">
                                    {{candidate.score}}
                                </td>
                                <td>{{numberWithCommas(candidate.votes)}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <footer class="uk-block  uk-cover-background uk-width-1-1 dark-box">
            <h4 class="uk-text-muted uk-text-center">Results update every hour.</h4>
        </footer>
    </div>
</template>
<style lang="css">
    .gray {
        color: gray;
    }
    .white {
        color: white;
    }
    .yellow {
        color: yellow;
    }
    .green {
        color: forestgreen;
    }
    .red {
        color: indianred;
    }
    .watched {
        color: rgba(63, 191, 127, 0.9) !important;
    }
    .uk-accordion-title {
        cursor: pointer;
    }
</style>
<script>
    const _ = require('lodash');
    const sitenav = require('./components/nav.vue');
    const sockets = require('./mixins/sockets');
    export default {
        name: 'channelDash',
        mixins: [sockets],
        data() {
            return {
                loaded: false,
                results: {}
            }
        },
        mounted() {
            this.fetchData();
        },
        methods: {
            numberWithCommas: function (n) {
                return (!n || !n.toString) ? '' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            fetchData: function () {
                let vm = this;
                fetch('/api/usage/channels/available').then(function (response) {
                    return response.json();
                }).then(function (data) {
                    if (data.status === 'success') {
                        vm.results = data.channels;
                    }
                    vm.loaded = true;
                }).catch(e => {
                    console.log(e);
                });
            },
            getTitle: function (result) {
                return !result.topic || !result.topic.topic ? '' : result.topic.topic;
            },
            getActionLink: function (channel, user) {
                let args = {
                    channel: encodeURIComponent(channel)
                };
                if (user) args.nick = user;
                //return laroute.route('channel', args);
                return '#';
            },
            getMostPop: function (result) {
                return _.first(result.popularityRanking.rankings).candidate;
            },
            getMostActive: function (result) {
                return _.first(result.topMonthlyParticipants).nick;
            },
            displayBar: function (result) {
                return result.currentOps.length ||
                    result.currentVoices.length ||
                    result.currentParticipants.length ||
                    (result.popularityRanking && result.popularityRanking.meanScore) ||
                    result.kicks ||
                    result.actions ||
                    result.topMonthlyParticipants.length ||
                    result.popularityRanking;
            },
        },
        computed: {
            sortedResults: function () {
                return _(this.results).mapKeys((value, key) => {
                    return value.channel = key;
                }).orderBy(['isWatching', 'messages'], ['desc', 'desc']).value();
            }
        },
        components: {
            sitenav
        }
    }
</script>
