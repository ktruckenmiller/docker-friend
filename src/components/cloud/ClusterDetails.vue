<template lang="html">
  <div class="cluster_details">
    <div class="tabs is-centered is-boxed">
      <ul>
        <li :class="[activeTab === 'services' ? 'is-active':'']"><a @click="focus">services</a></li>
        <li :class="[activeTab === 'instances' ? 'is-active':'']"><a @click="focus">instances</a></li>
      </ul>
    </div>
    <h3>{{$store.state.activeCluster}}</h3>
    <ClusterServices v-if="activeTab === 'services'"></ClusterServices>
    <ClusterInstances v-if="activeTab === 'instances'"></ClusterInstances>
  </div>
</template>

<script>
import ClusterServices from './ClusterServices'
import ClusterInstances from './ClusterInstances'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'clusterdetails',
  components: {ClusterServices, ClusterInstances},
  data() {
    return {
      activeTab: 'services',
    }
  },
  methods: {
    focus(e) {
      this.activeTab = e.target.text
    }
  }
}
</script>

<style lang="scss">
@import "../../scss/global.scss";
.cluster_details {
  h3 {
      text-align:left;
      font-weight:300;
      padding-left:20px;
  }
  padding: 0px 20px 20px 20px;
  .tabs {
    &:not(:last-child) {
      margin-bottom: 0;
    }
    ul {
      li {
        a {
          font-size:22px;
          letter-spacing: 2px;
          padding: 8px 20px;
          font-weight: 100;
          color: $blue;
        }
      }
    }
  }
}
</style>
