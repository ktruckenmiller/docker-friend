import Vue from 'vue'
import Vuex from 'vuex'
import docker from 'functions/docker'

Vue.use(Vuex)

// root state object.
// each Vuex instance is just a single state tree.
const state = {
  currentProfile: window.sessionStorage.getItem('_awsProfile'),
  containers: [],
  containerImages: [],
  error: "",
  profileNames: [],
  modalState: false,
  modalProfile: ""
}

// mutations are operations that actually mutates the state.
// each mutation handler gets the entire state tree as the
// first argument, followed by additional payload arguments.
// mutations must be synchronous and can be recorded by plugins
// for debugging purposes.
const mutations = {
  error(state, err) {
    state.error = err
  },
  changeProfile (state, profile_name) {
    state.currentProfile = profile_name
  },
  logOut(state) {
    state.currentProfile = ''
  },
  updateContainers(state, containers) {
    state.containers = containers
  },
  updateImages(state, new_images) {
    state.containerImages = JSON.parse(new_images)
  },
  profileNames(state, profileNames) {
    state.profileNames = profileNames
  },
  modalSet(state, bool) {
    state.modalState = bool
  },
  modalProfile(state, obj) {
    state.modalProfile = obj.profile
  }
}

// actions are functions that causes side effects and can involve
// asynchronous operations.
const actions = {
  increment: ({ commit }) => commit('increment'),
  decrement: ({ commit }) => commit('decrement'),
  incrementIfOdd ({ commit, state }) {
    if ((state.count + 1) % 2 === 0) {
      commit('increment')
    }1
  },
  incrementAsync ({ commit }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        commit('increment')
        resolve()
      }, 1000)
    })
  },
  logout({commit}) {
    // maybe do some api call to reset roles?
    commit('logOut')
  },
  changeProfileSelection({ commit, state}, e) {
    // api call to set credentials
    commit('changeProfile', {profile: e.target.value})
  },
  updateContainers({commit, state}, newObj) {
    commit('updateContainers', newObj)
  },
  updateImages({commit, state}, newImages) {
    commit('updateImages', newImages)
  },
  removeContainer( {commit, state}, container) {
    docker.removeContainer(container).then(res => {
      if(res.body.message) {
        commit('error', res.body.message)
        commit('modalSet', true)
      }
    }).catch((err) => {
      commit('error', 'We couldnt get a response back')
    })
  },
  startContainer( {commit, state}, container) {
    docker.startContainer(container).catch((err) => {
      commit('error', err)
    })
  },
  stopContainer( {commit, state}, container) {
    docker.stopContainer(container).catch((err) => {
      commit('error', err)
    })
  },
  restartContainer( {commit, state}, container) {
    docker.restartContainer(container).catch((err) => {
      commit('error', err)
    })
  },
  getProfileNames({commit, state}) {
    return Vue.http.get('http://localhost:8010/aws/profiles').then(res => {
      commit('profileNames', res.body)
    }).catch(err => {
      commit('err', err)

    })
  },
  hideModal({commit, state}) {
    commit('modalSet', false)
    commit('modalProfile', false)
    commit('error', '')
  },
  showModal({commit, state}) {
    commit('modalSet', true)
  },
  openLogin({commit, state}, profile) {
    // commit('login', profile)
    commit('modalSet', true)
    commit('modalProfile', {profile: profile})
  },
  submitMFA({commit, state}, mfa) {
    return Vue.http.post('http://localhost:8010/aws/submitmfa', {"mfa": mfa, "profile": state.modalProfile})
  },
  // assumeRole({commit, state}) {
  //   Vue.http.post('http://localhost:8010/aws/assumerole').then(res => {
  //     console.log(res)
  //   }).catch(err => {
  //     console.log(err)
  //   })
  // },
  removeImage({commit, state}, imageId) {
    docker.removeImage(imageId).catch(err => {
      console.log(err)
    }).then(res => {
      console.log(res)
    })
  }

}

// getters are functions
const getters = {
  evenOrOdd: state => state.count % 2 === 0 ? 'even' : 'odd'
}

// A Vuex instance is created by combining the state, mutations, actions,
// and getters.
export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
