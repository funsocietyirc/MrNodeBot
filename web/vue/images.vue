<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">Images</h1>
            </header>
        </div>
        <hr class="uk-width-1-1 uk-margin-bottom">
    </div>
</template>
<style>
</style>
<script>
    const sitenav = require('./components/nav.vue');
    const sockets = require('./mixins/sockets');

    export default {
        name: 'images',
        mixins: ['sockets'],
        components: {sitenav},
        data: function () {
            return {}
        },
        mounted() {
        },
    }
</script>
