<template lang="html">
  <div class="cluster_wrap">
    <SideBar :pageName="pageName"></SideBar>
    <CloudView :pageName="pageName" ></CloudView>
  </div>
</template>

<script>
import SideBar from './SideBar'
import CloudView from './CloudView'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'clusters',
  components: {SideBar, CloudView},
  props: ['pageName'],
  created() {
    this.updateClusters()
  },
  methods: mapActions(['updateClusters']),
  getters: mapGetters(['clusterObjects'])
}
</script>

<style lang="scss">

  .cluster_wrap {
    display: flex;
    flex-direction: row;
    > div {
      margin-top: 10px;
    }
    .sidebar {
      width: 20vw;

    }
    .cloudview {
      width: 100%;
    }
  }
</style>
