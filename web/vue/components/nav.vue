<template>
    <nav class="uk-navbar">
        <a href="" class="uk-navbar-brand">MrNodeBot</a>
        <ul class="uk-navbar-nav"  v-for="result in results">
            <li :class="{'uk-active' : result.path !== '/' ? currentLocation().startsWith(result.navPath) : result.desc !== 'Home' }"><a :alt="result.desc" :href="result.navPath">{{result.desc}}</a></li>
        </ul>
    </nav>
</template>
<style>
    .uk-navbar {
        background: #000;
        color: #fff;
    }
    .uk-navbar-nav > li > a {
        color: #fff;
    }
</style>
<script>
    module.exports = {
        name: 'sitenav',
        data() {
            return {
                results: [],
                currentLocation: () => window.location.href
            };
        },
        render() {},
        mounted() {
            const vm = this;
            let route = `/api/pages`;
            // Transfer over query params
            fetch(route)
                .then(response => response.json())
                .then((data) => {
                    vm.results = data.results;
                }).catch(e => {
                console.log(`Something went wrong: ${e.message}`);
            });
        }
    }
</script>
