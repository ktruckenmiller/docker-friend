<template lang="html">
  <div id="menu"class="row">
    <ul class="menu">
      <li class="menu__item menu__item--dropdown" v-on:click="toggle('ranking')" v-bind:class="{'open' : dropDowns.ranking.open}">
          <a title="Select AWS Profile" class="menu__link menu__link--toggle">
            <i class="fa fa-user-circle" aria-hidden="true"></i>
            <i class='fa fa-caret-down'></i>
          </a>
          <ul class="dropdown-menu">
              <!-- <li class="dropdown-menu__item aws">AWS</li> -->
              <li class="dropdown-menu__item"><a class="dropdown-menu__link select-base">select base profile</a></li>
              <li class="dropdown-menu__item" v-for="profile in $store.state.profileNames">
                  <a @click="login(profile)" :class="['dropdown-menu__link', {active: isActiveProfile(profile)}]">{{profile}}<i class="fa fa-amazon" aria-hidden="true"></i></a>
              </li>
              <!-- <li class="dropdown-menu__item">
                  <a @click="logout" class="dropdown-menu__link">clear profile</a>
              </li> -->
          </ul>
      </li>
  </ul>
  </div>
</template>

<script>
  import { map } from 'lodash'
  import store from 'vuex'
  export default {
    name: 'dropmenu',
    created() {
      var self = this
      window.addEventListener('click', function(e){
        if (! e.target.parentNode.classList.contains('menu__link--toggle'))
        {
          self.close()
        }
      }, false)
      this.$store.dispatch('getCurrentProfile')
      this.$store.dispatch('getProfileNames')
    },
    data() {
      return {
        dropDowns: {
          ranking: { open: false}
        },
        currentProfile: ''
      }
    },
    methods: {
      toggle(dropdownName) {
         this.dropDowns[dropdownName].open = !this.dropDowns[dropdownName].open;
      },
      close() {
        _.map(this.dropDowns, function(val, k) {
          val.open = false
        })
      },
      logout() {
        this.$store.dispatch('logout')
      },
      login(profile)  {
        this.$store.dispatch('openLogin', profile)
      },
      changeProfileSelection() {
        console.log(' change profile selection !')
      },
      isActiveProfile(className) {
        return className === this.$store.state.currentProfile
      }
    },
    computed: {

    }
  }
</script>

<style lang="scss">
  @import "../scss/global.scss";
  .menu {
      display: flex;
      padding-bottom:0;
      background: transparent;
      &__item {
          position: relative;
          padding-right: 3rem;
      }

      &__link {
          text-transform: uppercase;
      }

      &__icon {
          margin: 0 !important;
      }
      .dropdown-menu {
          position: absolute;
          right:0;
          padding-top:0;
          transform: translateX(-100px);
          min-width: 190px;
          top: 2.2rem;
          display: none;
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
          border-radius: 4px;
      }

      .dropdown-menu__item {

        a {

        }
        &:first-child {
          .dropdown-menu__link {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
        }
        &:last-child {
          .dropdown-menu__link {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }
        }
        i.fa-amazon {
          display: none;
        }
        .active {
          i.fa-amazon {
            display:block;
            color: $green;
          }
          &:hover {

          }
        }
      }
  }
  .current_profile {
    display:flex;
    flex-direction: row;
    padding:20px 20px;
    color:$black;
    cursor:pointer;
    .unset {
      display:none;
    }
    .fa-user-circle {
      padding:3px 6px 1px 1px;
    }
    .fa-caret-down {
      padding:4px 10px;

      // color:$black;
      &:hover {
        // color:$dark_blue;
      }
    }
    .menu__link {
      font-weight: 400;
      color:$black;
    }

    .dropdown-menu__item {
      &:first-child {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }
      &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }
      background-color:white;
      &:hover {
        background-color:$blue;
        a {
          color:white;
        }
      }
      .dropdown-menu__link {
        font-weight:100;
        padding: .5rem;
        color: $blue;
        display:flex;
        justify-content: space-between;
        i.fa-amazon {
          transform: translateY(4px);

          // padding-left:10px;
        }
      }
      .select-base {
        background-color: $blue;
        color: white;
        cursor: initial;
        box-shadow:inset 0px -1px 2px rgba(0,0,0,.1);
      }
    }
    &.elevated {
      p, .fa-caret-down {
        // color:$blue;
      }
      .fa-caret-down {
        &:hover {
          // color:$dark_blue;
        }
      }
    }

    form {
      margin-bottom: 0;
    }
    a {
      &:hover {
        color:$dark_blue;
      }
    }
  }
  .open .dropdown-menu {
      display: block;
  }


</style>
