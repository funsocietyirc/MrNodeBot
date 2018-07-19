<template>
    <transition name="fade">
        <div :css="cssClass" v-show="show">
            <slot></slot>
            <span class="Alert__close" v-show="important" @click="show = false">X</span>
        </div>
    </transition>
</template>
<style>
    .Alert {
        padding: 10px;
        position: fixed;
        bottom: 0;
        width: 100%;
        text-align: center;
    }

    .Alert-- {
        background: rgba(0, 0, 0, 0.8);
    }

    .Alert--Info {
        background: rgba(61, 150, 221, 0.8);
    }

    .Alert--Success {
        background: rgba(54, 168, 21, 0.8);
    }

    .Alert--Danger,
    .Alert--Error {
        background: rgba(218, 2, 0, 0.8);
    }

    .Alert__close {
        position: absolute;
        top: 10px;
        right: 30px;
        cursor: pointer;
        color: red;
    }

    .fade-enter-active {
        transition: opacity .4s ease;
    }

    .fade-leave-active {
        opacity: 0;
    }
</style>
<script>
    const _ = require('lodash');
    export default {
        props: {
            type: {
                'default': ''
            },
            timeout: {
                'default': '5000'
            },
            important: {
                type: Boolean,
                'default': false
            }
        },
        computed: {
            cssClass: function() {
                return 'Alert Alert--' + _.capitalize(this.type);
            }
        },
        data() {
            return {
                show: true
            };
        },
        mounted() {
            this.$nextTick(() => {
                if (!this.important) {
                    setTimeout(() => this.show = false, this.timeout);
                }
            });
        }
    }
</script>
