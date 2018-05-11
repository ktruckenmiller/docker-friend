<template lang="html">
  <div class="cloudview">
    <div v-if="pageName === 'clusters'" class="">
      <ClusterDetails></ClusterDetails>
    </div>
  </div>
</template>

<script>
import ClusterDetails from './ClusterDetails'
export default {
  name: 'cloudview',
  props: ['pageName'],
  created() {
    console.log(`create ${this.pageName}`)
  },
  components: {ClusterDetails}
}
</script>

<style lang="scss">
@import "../../scss/global.scss";
.cloudview, .sidebar {
  h3 {
    font-weight:100;
    letter-spacing:2px;
    font-family: 'Helvetica Neue';
    font-size: 28px;
    margin-bottom:10px;
    color: $blue;
    text-align: center;
  }
}

</style>
