import Vue from 'vue'
import Vuex from 'vuex'
import docker from 'functions/docker'
import { map, find, assignIn, clone } from 'lodash'

Vue.use(Vuex)

// root state object.
// each Vuex instance is just a single state tree.
const state = {
  currentProfile: window.sessionStorage.getItem('_awsProfile') || 'default',
  containers: [],
  containerState: [],
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
  updateProfileName (stage, profile_name) {
    state.currentProfile = profile_name
  },
  logOut(state) {
    state.currentProfile = ''
  },
  updateContainers(state, containers) {
    state.containers = map(containers, (newContainer) => {
      let oldContainer = find(state.containers, (val) => {
        if (val.Id === newContainer.Id) {return val}
      })
      if(oldContainer) {
        return assignIn(oldContainer, newContainer)
      }else {
        return newContainer
      }
    })
  },
  updateContainerSingle(state, container) {
    state.containers = map(state.containers, (oldContainer) => {
      if(container.Id === oldContainer.Id) {
        return assignIn(oldContainer, container)
      } else {
        return oldContainer
      }
    })
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
  logout({commit}) {
    // maybe do some api call to reset roles?
    commit('logOut')
  },
  changeProfileSelection({ commit, state}, profileName) {
    // api call to set credentials
    window.sessionStorage.setItem('_awsProfile', profileName)
    console.log(' change profile selection')
    commit('changeProfile', profileName)
  },
  updateProfileName({ commit, state}, profileName) {
    commit('updateProfileName', profileName)
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
  async startContainer( {commit, state}, container) {
    let cont = clone(container)
    commit('updateContainerSingle', assignIn(cont, {Transition: 'starting'}))
    try {
      docker.startContainer(container)
    } catch(err) {
      commit('error', err)
    }

    commit('updateContainerSingle', assignIn(cont, {Transition: ''}))
  },
  async stopContainer( {commit, state}, container) {
    let cont = clone(container)
    commit('updateContainerSingle', assignIn(cont, {Transition: 'stopping'}))
    try {
      let res = await docker.stopContainer(container)
    }catch(err) {commit('error', err)}
    commit('updateContainerSingle', assignIn(cont, {Transition: ''}))
  },
  async restartContainer( {commit, state}, container) {
    let cont = clone(container)
    commit('updateContainerSingle', assignIn(cont, {Transition: 'restarting'}))
    try {
      await docker.restartContainer(container)
    }catch(err) {commit('error', err)}
    commit('updateContainerSingle', assignIn(cont, {Transition: ''}))
  },
  getCurrentProfile({commit, state}) {
    return Vue.http.get(`http://${process.env.API_HOST}/aws/currentProfile`).then(res => {
      commit('updateProfileName', res)
    }).catch(err => {
      commit('err', err)
    })
  },
  getProfileNames({commit, state}) {
    return Vue.http.get(`http://${process.env.API_HOST}/aws/profiles`).then(res => {
      commit('profileNames', res.body)
    }).catch(err => {
      commit('err', err)
    })
  },
  updateEvents({commit, state}, newEvent) {
    console.log(newEvent)
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
