<template>
    <div>
        <sitenav></sitenav>
        <div class="uk-grid uk-grid-small uk-container-center" data-uk-grid-match>
            <header class="uk-block  uk-cover-background uk-width-1-1 dark-box">
                <h1 class="uk-text-truncate uk-text-center">Image Upload</h1>
            </header>
            <hr class="uk-width-1-1 uk-margin-bottom">
            <div class="uk-width-1-1 uk-panel uk-panel-box">
                <div class="uk-panel-body">
                    <form class="uk-form uk-form-horizontal  uk-margin-right uk-margin-left" :action="route"
                          method="post"
                          ref="uploadForm" id="uploadForm" enctype="multipart/form-data">
                        <fieldset data-uk-margin>
                            <legend>Details:</legend>
                            <div class="uk-form-row">
                                <label class="uk-form-label" for="image">File</label>
                                <div class="uk-form-controls">
                                    <input type="file" name="image" id="image" multiple accept="images/*">
                                    <p class="uk-form-help-inline">Only Image files are accepted</p>
                                </div>
                            </div>
                            <div class="uk-form-row">
                                <label class="uk-form-label" for="nsfw">NSFW</label>
                                <div class="uk-form-controls">
                                    <input type="checkbox" id="nsfw" name="nsfw" checked="false">
                                    <p class="uk-form-help-inline">Check if Not Safe For Work</p>
                                </div>
                            </div>
                            <div class="uk-form-row">
                                <label class="uk-form-label" for="token">Token</label>
                                <div class="uk-form-controls">
                                    <input type="text" id="token" name="token">
                                    <p class="uk-form-help-inline">Inside a channel use, [BotName] upload-token</p>
                                </div>
                            </div>
                            <div class="uk-form-row">
                                <div class="uk-form-controls">
                                    <input class="uk-button-danger" type="submit" value="Upload">
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
    .uk-form-controls {
        color: white;
    }

    .uk-form-help-inline {
        color: dimgrey;
    }
</style>
<script>
    const sitenav = require('./components/nav.vue');
    const sockets = require('./mixins/sockets');

    export default {
        name: 'Image Upload',
        mixins: ['sockets'],
        components: {sitenav},
        data: function () {
            return {
                route: ''
            }
        },
        mounted() {
            this.initTokens();
        },
        methods: {
            initTokens() {
                if (!(typeof Storage === 'undefined')) {
                    return;
                }
                const form = $('#uploadForm');
                const token = $('#token');

                if (localStorage.getItem('token')) {
                    token.val(localStorage.getItem('token'));
                }
                form.submit(() => {
                    localStorage.setItem('token', token.val());
                });
            }
        }
    }
</script>
