<template lang="html">
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <!-- <i class='fa fa-close' @click="hideModal()"></i> -->
          <ModalError v-if="$store.state.error"> </ModalError>
          <ModalProfile v-if="this.$store.state.modalProfile"></ModalProfile>
          <ModalStats v-if="this.$store.state.modalStats"></ModalStats>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

import Nes from 'nes'
import ModalError from './modals/ModalError'
import ModalProfile from './modals/ModalProfile'
import ModalStats from './modals/ModalStats'
import {isEmpty} from 'lodash'
import { mapActions } from 'vuex'
const client = new Nes.Client(`ws://${process.env.API_HOST}`);
export default {
  name: 'modal',
  methods: mapActions([
    'hideModal',
    'updateEvents'
  ]),
  created () {
    let that = this
    client.connect(function(err) {
      client.subscribe('/events', that.updateEvents, function (err) {})
    })
  },
  components: {ModalError, ModalProfile, ModalStats}

}
</script>

<style lang="scss">
  @import "../scss/global.scss";
  .fa-close {
    position:absolute;
    top:10px;
    right:10px;
    font-size:24px;
    color:$blue;
    cursor:pointer;
    &:hover {
      color: $dark_blue;
    }
  }
  .modal-mask {

    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    display: table;
    transition: opacity .3s ease;
  }

  .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
  }

  .modal-container {
    position:relative;
    width: auto;
    max-width:50%;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }

  .modal-header h3 {
    margin-top: 0;
    color: #42b983;
  }

  .modal-body {
    margin: 20px 0;
  }

  .modal-default-button {
    float: right;
  }

  /*
   * The following styles are auto-applied to elements with
   * transition="modal" when their visibility is toggled
   * by Vue.js.
   *
   * You can easily play with the modal transition by editing
   * these styles.
   */

  .modal-enter {
    opacity: 0;
  }

  .modal-leave-active {
    opacity: 0;
  }

  .modal-enter .modal-container,
  .modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
  }
</style>
