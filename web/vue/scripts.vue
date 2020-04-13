<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">Scripts</h1>
            </header>
            <hr class="uk-width-1-1 uk-margin-bottom">
            <div class="uk-width-1-1 uk-panel uk-panel-box">
                <div class="uk-panel-body">
                    <table class="uk-table uk-table-middle uk-table-striped uk-table-condensed">
                        <thead>
                        <tr class="info">
                            <th>Name</th>
                            <th>Description</th>
                            <th>Creator</th>
                            <th>Last Updated</th>
                            <th>Last Commit</th>
                            <th>Notes</th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-for="result in results">
                            <tr class="uk-text-left">
                                <td class="to">{{result.name}}</td>
                                <td>{{result.desc}}</td>
                                <td class="from">{{result.createdBy}}</td>
                                <td class="timeStamp">{{result.lastUpdated.date}}</td>
                                <td>
                                    <a :href="'mailto:' + result.lastUpdated.email">{{result.lastUpdated.author}}</a>
                                </td>
                                <td class="">{{result.lastUpdated.subject}}</td>
                            </tr>
                        </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
</style>
<script>
    const sitenav = require('./components/nav.vue');
    const sokets = require('./mixins/sockets');

    export default {
        mixins: ['sockets'],
        components: { sitenav },
        data: function () {
            return {
                results: []
            }
        },
        mounted() {
        },
    }
</script>
