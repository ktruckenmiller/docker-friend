import Vue from 'vue'

export default {

  removeContainer(container) {
    return Vue.http.post('http://localhost:8010/container/remove', {"container": container.Names[0]})
  },
  startContainer(container) {
    return Vue.http.post('http://localhost:8010/container/start', {"container": container.Names[0]})
  },
  stopContainer(container) {
    return Vue.http.post('http://localhost:8010/container/stop', {"container": container.Names[0]})
  },
  restartContainer(container) {
    return Vue.http.post('http://localhost:8010/container/restart', {"container": container.Names[0]})
  },
  removeImage(imageId) {
    return Vue.http.post('http://localhost:8010/image/remove', {"force": true, 'image': imageId})
  }
  // other methods
}
