<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid">
            <div id="navBar" class="uk-width-large-1-10 uk-width-medium-2-10">
                <h1 class="uk-text-medium uk-text-center uk-margin-top uk-text-truncate">{{searchText || 'Links' | uppercase}}</h1>
                <div class="innerNavBar">
                    <transition name="fade" appear>
                        <table class="uk-table uk-table-condensed">
                            <thead>
                            <tr>
                                <th>Last 25 Channels</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-bind:class="{ 'currentSearch': isActiveSearch(result) }" v-for="result in to">
                                <td v-bind:data-to="result" class="to clickable" @click="updateFilter(result)">{{result}}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </transition>
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
                            <th>Title (Hover for URL)</th>
                            <th>Timestamp</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-bind:data-timestamp="result.timestamp" v-for="result in resultSet">
                            <td class="to uk-width-1-10 clickable" @click="updateFilter(result.to)">{{result.to}}</td>
                            <td class="from uk-width-1-10 clickable" @click="updateFilter(result.from)">{{result.from}}</td>
                            <td class="url uk-width-6-10">
                                <a data-uk-tooltip @click="linkClicked(result, $event)"
                                   :title="result.url">{{prepareResult(result)}}</a>
                            </td>
                            <td class="timeStamp uk-width-2-10">{{result.timestamp | date("%D %R")}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
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
    // Libs
    const _ = require('lodash');
    // Build Regex
    const interactiveSiteRegex = /^(https:\/\/www.youtube.com\/watch|https:\/\/youtu.be)/gm;
    const interactiveFileRegex = /(\.jpg|\.png|\.gif|\.mp4|\.jpeg|\.webm)$/gm;
    const hashPattern = /#/g;
    // Components
    const sitenav = require('./components/nav.vue');
    const urlSockets = require('./mixins/urlSockets');
    const filters = require('./mixins/filter');

    export default {
        mixins: [
           urlSockets
        ],
        components: {
            sitenav
        },
        data: function () {
            return {
                results: [],
                to: [],
                from: [],
                searchText: '',
                query: {},
            }
        },
        mounted() {
            this.searchText = '';
            this.fetchData(this);
        },
        computed: {
            resultSet: function () {
                if (_.isEmpty(this.results)) return [];
                return this.customFilter(this.results, this.searchText, 'in', 'from', 'to');
            },
        },
        watch: {
            results: function (val) {
                let to = _(val).map('to').uniq().take(25).value();
                let from = _(val).map('from').uniq().take(20).value();
                this.to = to;
                this.from = from;
            }
        },
        methods: {
            prepareResult: (result) => _.truncate(result.title || result.url, {
               length: 150,
               separator: '...',
            }),
            customFilter:  (array, needle, inKeyword, key, key2) => _.filter(array, item => needle === '' || _.toLower(item[key]) === _.toLower(needle) || _.toLower(item[key2]) === _.toLower(needle)),
            linkClicked: (link) => {
                // Filter on specific content
                if (
                    interactiveSiteRegex.test(link.url) ||
                    interactiveFileRegex.test(link.url)
                ) {
                    window.UIkit.lightbox.create([{
                        source: link.url,
                        title: link.title,
                        keyboard: false,
                    }]).show();
                    return;
                }

                // Just Open The link
                window.open(link.url, '_blank');
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
            fetchData: vm => {
                let route = `/api/urls?pageSize=200`;
                // Transfer over query params
                if (_.isObject(vm.query) && !_.isEmpty(vm.query)) {
                    Object
                        .keys(vm.query)
                        .filter(k => !_.isString(k) || !_.isString(Object.hasOwnProperty(vm.query[k])))
                        .forEach(key => route = route + `&${key}=${vm.query[key].replace(hashPattern, '%23')}`);
                }
                // Fetch Data
                fetch(route)
                    .then(response => response.json())
                    .then((data) => {
                        vm.results = data.results;
                    })
                    .catch(e => {
                        console.error(`Something went wrong: ${e.message || ''}`);
                        vm.results = [];
                });
            },
        }
    }
</script>
