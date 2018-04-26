<template lang="html">
  <div>
    <i @click="close()" class='fa fa-close'></i>
    {{$store.state.error}}
  </div>
</template>

<script>
export default {
  name: 'ModalError',
  methods: {
    close() {
      this.$store.dispatch('hideModal')
    }
  },
}
</script>

<style lang="css">
</style>
