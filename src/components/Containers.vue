
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
const client = new Nes.Client('ws://localhost:8009');

export default {
  name: 'index',
  data () {
    return {
      msg: ''
    }
  },
  methods: mapActions(['updateContainers']),
    // getIndex() {
    //
    //
    //   this.$http.get('http://localhost:8009/profiles').then(response => {
    //     console.log(response.body);
    //     // console.log(client)
    //   }, response => {
    //     // error callback
    //     console.log(response)
    //   });
    // }
  created() {
    let that = this
    // get endpoint stuff
    this.$http.get('http://localhost:8009/containers').then(res => {
      that.updateContainers(res.body)
    })
    // connect websockets
    client.connect(function(err) {
      client.subscribe('/containers', that.updateContainers, function(err) {console.log(err)})
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
