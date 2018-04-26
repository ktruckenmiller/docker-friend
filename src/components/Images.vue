
<template>

  <div id="container_images" class="container_images">
    <div v-for="containerImage in filteredImages" class="image_wrap col-lg-12 col-sm-12 col-xs-12">
      <SingleImage :containerImage="containerImage"></SingleImage>
    </div>
  </div>
</template>

<script>
import Nes from 'nes'
import { mapActions } from 'vuex'
import SingleImage from './SingleImage'
import { filter, isArray } from 'lodash'
const client = new Nes.Client(`ws://${process.env.API_HOST}`);

export default {
  name: 'index',
  data () {
    return {
      msg: ''
    }
  },
  components: {SingleImage},
  methods: mapActions(['updateImages']),
  computed: {
    filteredImages: function() {
      console.log()
      return _.filter(this.$store.state.containerImages, function(val) {
        console.log()

        if(_.isArray(val.RepoTags) || val.RepoTags) {
          if(val.RepoTags[0] !== '<none>:<none>') {
            return true
          }else {
            return false
          }
        }else {
          return true
        }

      })
    }
  },
    // getIndex() {
    //
    //
    //   this.$http.get(`http://${process.env.API_HOST}/profiles`).then(response => {
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
    this.$http.get(`http://${process.env.API_HOST}/images`).then(res => {
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
.container_images {
  display:flex;
  flex-wrap: wrap;
}
</style>
