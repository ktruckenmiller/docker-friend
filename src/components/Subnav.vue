<template lang="html">
  <div class="subnav">
    <ul v-if="this.$route.fullPath.includes('local')" class="local">
      <li v-bind:class="{active: this.$route.name === 'Containers'}"><router-link to="/local/containers"><i class="fa fa-braille" aria-hidden="true"></i>containers</router-link></li>
      <li v-bind:class="{active: this.$route.name === 'Images'}"><router-link to="/local/images"><i class="fa fa-codepen" aria-hidden="true"></i>images</router-link></li>
    </ul>
    <ul v-if="this.$route.name === 'Containers'" class="local removers">
      <!-- <li>Remove Exited</li>
      <li>Remove All</li> -->
    </ul>
    <ul v-if="this.$route.fullPath.includes('cloud')" class="cloud">
      <li :class="{active: this.$route.name === 'Clusters'}"><router-link to="/cloud/clusters"><i class="fa fa-server" aria-hidden="true"></i>clusters</router-link></li>
      <li :class="{active: this.$route.name === 'Services'}"><router-link to="/cloud/services"><i class="fa fa-pied-piper-alt" aria-hidden="true"></i>services</router-link></li>
      <li :class="{active: this.$route.name === 'Domains'}"><router-link to="/cloud/domains"><i class="fa fa fa-ravelry" aria-hidden="true"></i>domains</router-link></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'subnav',
  created() {
  },
  methods: {
    changeCloudSubpage() {

    }
  }
}
</script>

<style lang="scss">
@import "../scss/global.scss";
.subnav {
  padding: 14px 0 10px 24px;
  position:relative;
  background-color:$blue;
  display: flex;
  justify-content: space-between;
  ul {

    &.active {
      display:flex;

    }

    li {
      cursor:pointer;
      margin-left:0px;
      margin-right:20px;
      padding: 4px 10px 5px 10px;
      border-radius: 2px;
      font-weight:100;
      letter-spacing:1px;
      color:white;
      a {
        color:inherit;
        font-weight:inherit;
      }
      i {
        position:relative;
        top:2px;
        margin-right:6px;
      }
      .fa-codepen {
        top:0;

      }
      &:hover {
        color:rgba(233,233,233,1);
      }
      &.active {
        box-shadow:inset 1px 1px 1px rgba(0,0,0,.2);
        background-color:white;
        color:$blue;
      }
    }
  }
  .removers {

    li {
      background-color:$red;
      transition:box-shadow .2s ease-in-out;
      &:hover {
        color:white;
        box-shadow:1px 1px 2px rgba(12,12,12,.3);
      }
      &:active {
        background-color:$dark_red;
        transition: box-shadow .05s ease-in-out;
        box-shadow:0px 0px 0px rgba(12,12,12,.3);

      }

      margin-left:0px;
    }
  }
}
</style>
