<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid">
        </div>
    </div>
</template>
<style>
</style>
<script>
    const sitenav = require('./components/nav.vue');
    const sockets = require('./mixins/sockets');

    export default {
        name:'Images',
        mixins: ['sockets'],
        components: { sitenav },
        data: function () {
            return {
            }
        },
        mounted() {
        },
    }
</script>
