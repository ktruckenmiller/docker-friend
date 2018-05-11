<template lang="html">
  <div class="cluster_instances">
    {{currentInstances}}
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'clusterinstances',
  computed: {
    ...mapGetters(['currentCluster', 'currentInstances'])
  }
}
</script>

<style lang="scss">
.cluster_instances {
  // background-color:white;
  padding:20px;
}
</style>
