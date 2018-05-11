<template lang="html">
  <div class="modal-stats">
    <div class="left-thing"></div>
    <div v-if="loaded" class="">

      <h3>{{name}}</h3>
      <h5>mem: {{memPercent}}%</h5>
      <h5>cpu: {{cpuPercent}}%</h5>
      <h5>network-in: {{networkIn}}</h5>
      <h5>network-out: {{networkOut}}</h5>
    </div>
    <div v-else="loaded" class="">
      <CloudLoader></CloudLoader>
    </div>

    <i @click="close()" class='fa fa-close'></i>
  </div>
</template>

<script>
const prettysize = require('prettysize')
import CloudLoader from '../cloud/Loader'
import LineGraph from '../graphs/LineGraph'
export default {
  name: 'ModalStats',
  data() {
    return {
      stats: {},
      loaded: false,
      interval: null
    }
  },
  created() {
    this.loadStats()
    this.interval = setInterval(function () {
      console.log(this.stats)
      this.loadStats();
    }.bind(this), 500);
  },
  computed: {
    memUsed() {
      return this.stats.memory_stats.max_usage / 1024 / 1024 / 1024
    },
    memLimit() {
      return this.stats.memory_stats.limit / 1024 / 1024 / 1024
    },
    name() {
      return this.stats.name.split('/')[1]
    },
    memPercent() {
      return (this.stats.memory_stats.max_usage / this.stats.memory_stats.limit).toFixed(2)
    },
    cpuPercent() {
      return (this.stats.cpu_stats.cpu_usage.total_usage / this.stats.cpu_stats.system_cpu_usage).toFixed(2)
    },
    networkIn() {
      return prettysize(this.stats.networks.eth0.rx_bytes)
      // return (this.stats.networks.eth0.rx_bytes / 1024).toFixed(2)+'kB'
    },
    networkOut() {
      return prettysize(this.stats.networks.eth0.tx_bytes)
      // return (this.stats.networks.eth0.tx_bytes / 1024).toFixed(2)+'kB'
    }
  },
  methods: {
    loadStats: function () {
      this.$http.get(`http://${process.env.API_HOST}/container/stats/${this.$store.state.modalStats.Id}`).then(res => {
        this.stats = res.body
        this.loaded = true
      }).catch(err => {
        console.log(err)
      }).bind(this)
    },
    close() {
      this.$store.dispatch('hideModal')
    }
  },
  components: {LineGraph, CloudLoader},
  beforeDestroy() {
    clearInterval(this.interval)
  }
}
</script>

<style lang="scss">
@import "../../scss/global.scss";
.modal-stats {
  min-height:100px;
  .left-thing {
    position:absolute;
    left:0;
    top:0;
    // border-radius:2px;
    width:10px;
    height:100%;
    background-color: $blue;
  }
  h3 {
    color: $blue;
    font-size:34px;
  }
  .fa-close {
    right:13px;
  }
}
</style>
