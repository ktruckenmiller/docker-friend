import Vue from 'vue'

export default {

  removeContainer(container) {
    return Vue.http.post('http://localhost:8009/container/remove', {"container": container.Names[0]})
  },
  startContainer(container) {
    return Vue.http.post('http://localhost:8009/container/start', {"container": container.Names[0]})
  },
  stopContainer(container) {
    return Vue.http.post('http://localhost:8009/container/stop', {"container": container.Names[0]})
  },
  restartContainer(container) {
    return Vue.http.post('http://localhost:8009/container/restart', {"container": container.Names[0]})
  }
  // other methods
}
