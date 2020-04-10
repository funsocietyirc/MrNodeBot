<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid">
            <div class="uk-width-1-1 dark-box">
                <h1 class="uk-margin-top uk-margin-bottom uk-align-center">Quotes</h1>
                <hr>
            </div>
            <div class="uk-width-1-1">
                <table class="uk-table uk-table-middle uk-table-striped uk-table-condensed">
                    <thead>
                        <tr class="info">
                            <th>ID</th>
                            <th>Quote</th>
                            <th>To</th>
                            <th>From</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="result in results">
                            <tr class="uk-text-left">
                                <td>{{result.id}}</td>
                                <td class="message">{{result.text}}</td>
                                <td class="to">{{result.to}}</td>
                                <td class="from">{{result.from}}</td>
                                <td class="timeStamp">{{result.timestamp}}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<style>
</style>
<script>
    export default {
        name: 'Quotes',
        components: {
            sitenav: require('./components/nav.vue')
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
