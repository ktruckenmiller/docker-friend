<template lang="html">
  <div :class="['docker_container', 'box-row', container.Transition]">

    <span :class="[container.State, 'state', container.Transition]"></span>
    <div class="names">
      <h3>{{container.Names[0].replace("/", "")}}</h3>
      <p :class="container.ImagePrefix">{{container.Image}}</p>
    </div>
    <div class="controls">
      <i class="fa fa-key" :class="[container.AuthStatus.state]" v-if="container.AuthStatus.authed"  title="Load AWS Credentials"></i>
      <i class="fa fa-stop" @click="stopContainer(container)" v-if="container.State === 'running'" title="Stop Container"></i>
      <i class="fa fa-play" @click="startContainer(container)" v-if="container.State !== 'running'" title="Start Container"></i>
      <i class="fa fa-refresh" @click="restartContainer(container)" aria-hidden="true" title="Restart Container"></i>
      <i class="fa fa-times" @click="removeContainer(container)" aria-hidden="true" title="Remove Container"></i>
      <!-- <i class="fa fa-ellipsis-h" v-on:click="openModal('container', 'containerobj?')" aria-hidden="true"></i> -->
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  name: 'container',
  props: ['container'],
  methods: mapActions(['removeContainer', 'startContainer', 'restartContainer', 'stopContainer', 'assumeRole'])
}
</script>

<style lang="scss">
  @import "../scss/global.scss";
  #containers {
    padding: 20px 16px;
    .container_wrap {
      .docker_container {
        border:none;
        transition: all .3s ease-in-out;
        position:relative;
        padding:8px 15px 8px 20px;
        color:$dark_gray;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
        background-color:white;
        text-align:left;
        display:flex;
        justify-content: space-between;
        .names {
          transition: opacity .3s ease-in-out;
          h3 {
            color:$black;
          }
          p {
            font-size:12px;
          }
        }
        .controls {
          display:flex;
          align-items:center;
          opacity:0;
          transition: opacity .2s ease-in-out;
          object {
            max-height:20px;
          }
          i {
            margin: 0 0 0 20px;
            cursor:pointer;
            color:$blue;
            &:hover {
              color: $dark_blue;
            }
          }
          .fa-ellipsis-h {
            font-size:18px;
          }
          .fa-key {
            color: $red;
          }
          .fa-key.active {
            color:$green;
          }
        }
        &:hover {

          .controls {
            opacity:1;
          }
        }
        &.killing {
          box-shadow:0 25px 50px 0 rgba(0, 0, 0, 0.1);
          display:none;
          .fa-refresh {
            animation-name: spin;
            animation-duration: 4000ms;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
          }
        }
        &.stopping {
          .names {opacity:.4;}
          .controls {opacity: 0;}
        }
        &.restarting {
          .names {opacity:.4;}
          .fa-refresh {
            animation-name: spin;
            animation-duration: 4000ms;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
          }
          .controls {
            .fa-stop, .fa-times {opacity: 0;}
          }
          .state {
            animation: blueYellow 1s infinite alternate;
          }
        }
        .state {
          position:absolute;
          top:0;
          bottom:0;
          left:0px;
          width:8px;
          box-shadow: inset -2px 0px 1px rgba(0,0,0,.14);

          &.running {background-color:$blue;}
          &.exited {background-color:$dark_gray;}
          &.created {background-color:$yellow;}
          &.stopping {
            animation: redGray 1s infinite alternate;
          }
        }
        @keyframes redGray {
          0% {
            background-color: $red;
          }
          100% {
            background-color: $dark_gray;
          }
        }
        @keyframes blueYellow {
          0% {
            background-color: $blue;
          }
          100% {
            background-color: $yellow;
          }
        }
      }
    }
  }


  @keyframes spin {
      from {transform:rotate(0deg);}
      to {transform:rotate(360deg);}
  }
</style>
