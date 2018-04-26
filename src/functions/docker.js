import Vue from 'vue'

export default {

  removeContainer(container) {
    return Vue.http.post(`http://${process.env.API_HOST}/container/remove`, {"container": container.Names[0]})
  },
  startContainer(container) {
    return Vue.http.post(`http://${process.env.API_HOST}/container/start`, {"container": container.Names[0]})
  },
  stopContainer(container) {
    return Vue.http.post(`http://${process.env.API_HOST}/container/stop`, {"container": container.Names[0]})
  },
  restartContainer(container) {
    return Vue.http.post(`http://${process.env.API_HOST}/container/restart`, {"container": container.Names[0]})
  },
  removeImage(imageId) {
    return Vue.http.post(`http://${process.env.API_HOST}/image/remove`, {"force": true, 'image': imageId})
  }
  // other methods
}
