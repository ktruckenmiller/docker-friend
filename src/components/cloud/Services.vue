<template lang="html">
  <div>
    <CloudLoader></CloudLoader>
  </div>

</template>

<script>
import CloudLoader from './Loader'
export default {
  name: 'services',
  components: {CloudLoader}
}
</script>

<style lang="scss">
  @import "../../scss/global.scss";
  html {
    // background-image: radial-gradient(circle farthest-corner at center, #FFFFFF 0%, $blue 100%);
  }

</style>
