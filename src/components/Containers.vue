
<template>

  <div id="containers" class="containers">
    <div v-for="container in $store.state.containers" class="container_wrap col-lg-6 col-sm-12 col-xs-12">
      <container :container="container"></container>
    </div>
  </div>
</template>

<script>
import Nes from 'nes'
import { mapActions } from 'vuex'
import Container from './SingleContainer'
const client = new Nes.Client(`ws://${process.env.API_HOST}`);

export default {
  name: 'index',
  data () {
    return {
      msg: ''
    }
  },
  methods: mapActions(['updateContainers']),
  created() {
    let that = this
    // get endpoint stuff
    this.$http.get(`http://${process.env.API_HOST}/containers`).then(res => {
      // http request has body for some reason
      that.updateContainers(res.body)
    })
    // connect websockets
    client.connect(function(err) {
      client.subscribe('/containers', that.updateContainers, function (err) {})
    })
  },
  components: {Container}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .containers {
    display:flex;
    flex-wrap: wrap;
  }
</style>
