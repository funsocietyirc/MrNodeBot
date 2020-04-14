<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">Commands</h1>
            </header>

            <hr class="uk-width-1-1 uk-margin-bottom">
            <div class="uk-width-1-1 uk-panel uk-panel-box">
                <div class="uk-panel-body">
                    <table class="uk-table uk-table-middle uk-table-striped uk-table-condensed">
                        <thead>
                        <tr class="info">
                            <th>Command</th>
                            <th>Description</th>
                            <th>Access Level</th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-for="result in results">
                            <tr class="uk-text-left">
                                <td class="to">{{result.command}}</td>
                                <td>{{result.desc}}</td>
                                <td class="from">{{result.access}}</td>
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
    const sockets = require('./mixins/sockets');
    export default {
        name: 'commands',
        mixins: [sockets],
        components: {
            sitenav
        },
        data: function () {
            return {
                results: []
            }
        },
        mounted() {
        },
    }
</script>
