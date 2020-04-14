<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <img src="/assets/bot.png" class="uk-align-center" alt="MrNodeBot">
            </header>
            <hr class="uk-width-1-1 uk-margin-bottom">
        </div>
    </div>
</template>
<style>
</style>
<script>
    import sitenav from './components/nav.vue';

    const sokets = require('./mixins/sockets');
    export default {
        name: 'landing',
        mixins: ['sockets'],
        components: {
            sitenav
        },
        data: function () {
            return {}
        },
        mounted() {
        },
    }
</script>
