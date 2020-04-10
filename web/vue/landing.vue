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
    export default {
        name:'Home',
        components: {
            sitenav: require('./components/nav.vue')
        },
        data: function () {
            return {
            }
        },
        mounted() {
        },
    }
</script>
