<template lang="html">

  <div class="wrap">
    <transition name="fade">
      <div v-if="loading" class="loader">
        <div class="loading-pulse"></div>
      </div>
    </transition>
    <transition :duration="2000" name="fade">
      <div class="header">
        <p>profile: <span>{{$store.state.modalProfile}}</span></p>
      </div>
    </transition>
    <input
      ref="input"
      v-model.number="mfa"
      placeholder="MFA Token"
      type="number"
      v-on:input="updateValue($event.target.value)"
    >
    <div class="actionable">
      <div class="button cancel"  @click="cancel">cancel</div>
      <div
        v-bind:class="{ active: canSubmit, inactive: !canSubmit }"
        class="button"  @click="mfaAuth">submit</div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'ModalProfile',
  data () {
    return {
      mfa: '',
      canSubmit: false,
      loading: false
    }
  },
  methods: {
    updateValue: function(value) {
      const formattedValue = value.trim()
      if (formattedValue !== value) {
        this.$refs.input.value = formattedValue
      }
      if(String(formattedValue).length < 7 ) {
        this.mfa = formattedValue
      }else {
        this.mfa = Number(String(formattedValue).substring(0,6))
      }
      this.canSubmit = String(formattedValue).length > 5
      // Emit the number value through the input event
    },
    mfaAuth() {
      console.log()

      // this.$store.dispatch('mfaLogin', this.mfa)
      if(this.mfa.length === 6) {
        this.loading = true
        this.$store.dispatch('submitMFA', this.mfa).then(res => {
          this.loading = false
          this.$store.dispatch('hideModal')
        }).catch(err => {
          console.log(err)
        })
      }

    },
    cancel() {
      this.$store.dispatch('hideModal')
    }
  }
}
</script>

<style lang="scss">
  @import "../../scss/global.scss";
  @import "../../scss/buttons.scss";


  $base-line-height: 24px;
  $white: rgb(255,255,255);
  $off-white: rgba($white, 0.2);
  $spin-duration: 1s;
  $pulse-duration: 750ms;
  @keyframes pulse {
    50% {
      background: $white;
    }
  }
  .loading-pulse {
    position: relative;
    width: ($base-line-height / 4);
    height: $base-line-height;
    background: $off-white;
    animation: pulse $pulse-duration infinite;
    animation-delay: ($pulse-duration / 3);
    &:before, &:after {
      content: '';
      position: absolute;
      display: block;
      height: ($base-line-height / 1.5);
      width: ($base-line-height / 4);
      background: $off-white;
      top: 50%;
      transform: translateY(-50%);
      animation: pulse $pulse-duration infinite;
    }
    &:before {
      left: -($base-line-height / 2);
    }
    &:after {
      left: ($base-line-height / 2);
      animation-delay: ($pulse-duration / 1.5);
    }
  }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-input-placeholder {
    letter-spacing:1px;
    text-align:left;
    color:$blue;
    opacity:.2
  }

  .wrap {

    .loader {
      position:absolute;
      background-color:$blue;
      z-index:100;
      top:0;
      left:0;right:0;bottom:0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      // background: #333333;
    }
  }
  .header {
    p {

      color:$gray;
      span {
        color:$dark_gray;
      }
    }
  }
  .actionable {
    display:flex;
    justify-content: flex-end;
    align-items: center;


  }

  input {
    text-align:center;
    width:100%;
    position: relative;
    font-size: 6rem;
    border: none;
    line-height: 4rem;
    letter-spacing: 21px;
  }
</style>
