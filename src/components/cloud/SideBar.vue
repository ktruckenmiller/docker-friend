<template lang="html">
  <div class="sidebar">
    <h3>{{pageName}}</h3>
    <ul>
      <li class="list" v-for="(cluster, index) in $store.getters.clusterObjects" @click="setClusterActive(cluster.clusterName)">
        <div>{{cluster.clusterName}}</div>
        <div class="details">
          <span class="region">{{cluster.region}}</span>
          <span class="account">{{cluster.account}}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'sidebar',
  props: ['pageName'],
  methods: mapActions(['setClusterActive']),
  getters: mapGetters(['clusterObjects'])
}
</script>

<style lang="scss">
@import "../../scss/global.scss";
  .sidebar {

    ul {
      display: flex;
      flex-direction: column;
      padding:0 10px;
      li {
        display: flex;
        margin-bottom:10px;
        flex-direction: column;
        transition: all .1s ease-in-out;
        position:relative;
        padding:8px 8px 8px 8px;
        color:$dark_gray;
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
        background-color:white;
        &:hover {
          background-color: rgba(243,243,243,1);
          cursor:pointer;
        }
        &.active, &:active {
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
          position: relative;
          top:1px;
          left:1px;
        }
        .details {
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
        .account {
          color: $gray;
          font-size:10px;
        }
        .region {
          color: $blue;
        }
      }
    }
    .list {

    }
  }
</style>
