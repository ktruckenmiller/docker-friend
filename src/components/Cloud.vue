<template>
  <div class="cloud">
    cloud
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Cloud'
    }
  },
  methods: {
    getIndex() {
      this.$http.get(`http://${process.env.API_HOST}/profiles`).then(response => {
        console.log(response.body);

      }, response => {
        // error callback
        console.log(response)
      });
    }
  },
  created() {
    this.getIndex()
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
