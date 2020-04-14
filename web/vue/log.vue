<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">{{params.channel}}</h1>
                <h4 class="uk-text-truncate uk-text-center">{{params.date}}</h4>
            </header>
            <hr class="uk-width-1-1 uk-margin-bottom">
            <div class="uk-width-1-1 uk-panel uk-panel-box">
                <div class="uk-panel-body">
                    <div id="linkTableOverflow" class="uk-overflow-container">
                        <table id="linkTable" class="uk-table uk-table-striped uk-table-condensed uk-margin-top">
                            <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>From</th>
                                <th>Text</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-bind:data-timestamp="result.timestamp" v-for="result in results">
                                <td class="timeStamp uk-width-2-10">{{result.timestamp | date("%D %R")}}</td>
                                <td class="from uk-width-1-10">{{result.from}}</td>
                                <td class="text uk-width-7-10">{{result.text}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
    #linkTable > tbody > tr:first-child,
    #linkTable > tbody > tr:last-child {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
    }
</style>
<script>
    const sitenav = require('./components/nav.vue');
    const sockets = require('./mixins/sockets');

    export default {
        name: 'logs',
        mixins: ['sockets'],
        components: {
            sitenav
        },
        data: function () {
            return {
                results: [],
            }
        },
        mounted() {
            this.fetchData();
        },
        methods: {
            fetchData: function () {
                let vm = this;
                const route = `/api/log/${vm.params.channel.replace(new RegExp('#', 'g'), '%23')}/${vm.params.date}/${vm.params.page}`;
                fetch(route).then(response => response.json()).then(results => {
                    vm.results = results.results;
                }).catch(e => {
                    console.log(e);
                });
            },
        }
    }
</script>
