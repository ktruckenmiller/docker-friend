<template lang="html">
  <div class="image box-row">

    <!-- <span :class="[container.State, 'state']"></span> -->
    <div class="names">


      <h3 :class="realName">{{realName}}</h3>
      <p>{{virtualSize}}</p>
      <p>{{created}}</p>
    </div>
    <div class="controls">
      <i @click="removeImage()" class="fa fa-trash-o" aria-hidden="true"></i>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { isEmpty } from 'lodash'
const prettysize = require('prettysize')
const moment = require('moment')
export default {
  name: 'container-image',
  props: ['containerImage'],
  data() {
    return {
      size: 0
    }
  },
  methods: {
    removeImage(id) {
      console.log(this.containerImage.Id)
    }
  },
  computed: {
    virtualSize: function() {
      return prettysize(this.containerImage.VirtualSize)
    },
    digest: function() {
      return this.containerImage.Id.substr(this.containerImage.RepoDigests.length - 12)
    },
    created: function() {
      return moment.unix(this.containerImage.Created).fromNow()
    },
    realName: function() {
      if(_.isEmpty(this.containerImage.RepoTags)) {
        return 'none'
      }else {
        if(this.containerImage.RepoTags[0] === '<none>:<none>') {
          return 'none'
        }else {
          return this.containerImage.RepoTags[0]
        }

      }

    }
  }
}
</script>

<style lang="scss" scoped>
@import "../scss/global.scss";

p {
  text-align:left;
}
h3 {
  text-align:left;
  &.none {
    opacity: .2;
  }
}

.image_wrap {

  .image {
    min-height:150px;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+50,e5e5e5+100 */
    background: #ffffff; /* Old browsers */
    background: -moz-linear-gradient(-45deg, #ffffff 50%, #e5e5e5 100%); /* FF3.6-15 */
    background: -webkit-linear-gradient(-45deg, #ffffff 50%,#e5e5e5 100%); /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(135deg, #ffffff 50%,#e5e5e5 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ffffff', endColorstr='#e5e5e5',GradientType=1 ); /* IE6-9 fallback on horizontal gradient */
    box-shadow:1px 1px 1px rgba(0,0,0,.7), 5px 12px 40px rgba(0,0,0,.2);
    color:$black;
    transition: box-shadow .1s ease-in-out;
    border:none;
    .fa {

      position:absolute;
      top:24px;
      right:24px;
      font-size: 81px;
      color:transparent;
      transition: text-shadow .5s ease-in-out;
      text-shadow: 1px 1px 12px rgba(0,0,0,0);
      cursor:pointer;

    }
    &:hover {
      box-shadow:4px 4px 4px rgba(0,0,0,.3), 5px 12px 40px rgba(0,0,0,.2);
      .fa {
        color:rgb(244,244,244);
        text-shadow: 1px 1px 12px rgba(0,0,0,.3);
        &:active {
            transition: text-shadow .1s ease-in-out;
            text-shadow: -1px -1px 1px rgba(0,0,0,.3);
        }
      }
    }

  }
}
</style>
