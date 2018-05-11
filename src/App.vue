
<template>
  <div id="app">
    <navigation></navigation>
    <subnav></subnav>
    <router-view></router-view>
    <!-- <button id="show-modal" @click="showModal()">Show Modal</button> -->
    <modal v-if="$store.state.modalState" @close="hideModal()">
      <!-- <h3 slot="header">custom header</h3> -->
    </modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Navigation from './components/Navigation'
import Subnav from './components/Subnav'
import Modal from './components/Modal'

export default {
  name: 'app',
  data () {
    return {

    }
  },
  created() {

  },
  methods: mapActions([
    'changeProfileSelection',
    'showModal',
    'hideModal'
  ]),
  components: {Navigation, Subnav, Modal}
}
</script>

<style lang="scss">
  @import './assets/font-awesome/scss/font-awesome.scss';
  @import './scss/flex-grid.scss';
</style>
