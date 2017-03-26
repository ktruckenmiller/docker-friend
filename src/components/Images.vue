
<template>
  <div class="images">
    {{$store.state.images}}
  </div>
</template>

<script>
import Nes from 'nes'
import { mapActions } from 'vuex'
const client = new Nes.Client('ws://localhost:8009');

export default {
  name: 'index',
  data () {
    return {
      msg: ''
    }
  },
  methods: mapActions(['updateImages']),
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
    this.$http.get('http://localhost:8009/images').then(res => {
      console.log(res)
      that.updateImages(res.body)
    })
    // connect websockets
    client.connect(function(err) {
      client.subscribe('/images', that.updateImages, function(err) {console.log(err)})
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
