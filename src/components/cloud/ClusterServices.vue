<template lang="html">
  <div class="cluster_services">

    <ServiceSingle v-for="service in currentServices" :service="service"></ServiceSingle>
  </div>
</template>

<script>
import ServiceSingle from './ServiceSingle'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'clusterservices',
  computed: {
    ...mapGetters(['currentCluster', 'currentServices'])
  },
  components: {ServiceSingle}
}
</script>

<style lang="scss">
.cluster_services {
  // background-color: rgba(255,255,255,.01);
  padding:0px 20px 20px 20px;
  border-radius: 10px;
}
</style>
