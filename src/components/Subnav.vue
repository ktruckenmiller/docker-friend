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
    <ul v-if="this.$route.name === 'Cloud'" class="cloud">
      <!-- <li v-on:click="changeCloudSubpage" v-bind:class="{active: isCommit}"><i class="fa fa-github" aria-hidden="true"></i>commit</li>
      <li v-on:click="changeCloudSubpage" v-bind:class="{active: isBuild}"><i class="fa fa-wrench" aria-hidden="true"></i>build</li>
      <li v-on:click="changeCloudSubpage" v-bind:class="{active: isDeploy}"><i class="fa fa-server" aria-hidden="true"></i>deploy</li> -->
    </ul>
  </div>
</template>

<script>
export default {
  name: 'subnav',
  created() {
  }
}
</script>

<style lang="scss">
@import "../scss/global.scss";
.subnav {
  padding-top: 70px;
  padding: 76px 0 10px 24px;
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
