<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid">
            <div class="uk-width-1-1">
                <h1>
                    {{params.channel}}
                </h1>
                <h3>
                    {{params.date}}
                </h3>
            </div>
            <div class="uk-width-1-1">
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
