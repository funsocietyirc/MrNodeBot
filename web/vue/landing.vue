<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid">
            <img src="/assets/bot.png" class="uk-align-center" alt="MrNodeBot">
        </div>
    </div>
</template>
<style>
</style>
<script>
    import sitenav from './components/nav.vue';
    const sokets = require('./mixins/sockets');

    export default {
        name:'Home',
        mixins: ['sockets'],
        components: {
            sitenav
        },
        data: function () {
            return {
            }
        },
        mounted() {
        },
    }
</script>
