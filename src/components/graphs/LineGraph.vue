<template lang="html">
  <div class="line-graph">
    {{percent}}
    <div class="fill" :style="{width: (percent)+'%'}">
		</div>
  </div>

</template>

<script>
export default {
  name: 'line-graph',
  data() {
    return {
    }
  },
  computed: {
  },
  props: ['percent'],
  methods: {
  }
}
</script>
<style lang="scss">
  @import "../../scss/global.scss";
  .line-graph {
    position:relative;
    width:100%;
    overflow:hidden;
    height:40px;
    padding:10px;
    border-radius: 2px;
    box-shadow: inset 1px 1px 2px rgba(0,0,0,.3);
  }
  .fill {
    position:absolute;

    transition: width .2s ease-in-out;
    border-radius: 2px;
    width:100%;
    height:100%;
    background-color:$blue;
  }
</style>
