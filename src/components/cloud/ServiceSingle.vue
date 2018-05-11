<template lang="html">
  <div class="service_single">
    <div class="status">
      <span :class="[service.status, 'state']"></span>
    </div>
    <div class="info">
      <h3>{{service.serviceName}}</h3>
    </div>
    <div class="details">
      num: {{service.runningCount}}
      created: {{dateCreated}}
      <i v-for="i in service.runningCount" class="fa-cube fa"></i>
      <i v-for="i in service.pendingCount" class="fa-cube fa pending"></i>
    </div>

  </div>
</template>

<script>
import moment from 'moment'
export default {
  name: 'servicesingle',
  props: ['service'],
  computed: {
    dateCreated() {
      return moment(this.service.createdAt).fromNow()
    }
  }
}
</script>

<style lang="scss">
@import "../../scss/global.scss";
.service_single {
  background-color:white;
  padding:10px;
  border-radius: 2px;
  margin-bottom:10px;
  color:$blue;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
  h3 {
    margin:0;padding:0;
    font-weight:300;
    font-size:16px;
  }
  .status {
    .ACTIVE {
      background-color: $blue;

    }
    .PENDING {
      background-color: $yellow;
    }

  }
  .details {
    .pending {
      color: $yellow;
    }
  }
}
</style>
