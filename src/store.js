import Vue from 'vue'
import Vuex from 'vuex'
import docker from 'functions/docker'
import {
  map,
  find,
  assignIn,
  clone,
  last,
  chain,
  sortBy
} from 'lodash'

Vue.use(Vuex)

// root state object.
// each Vuex instance is just a single state tree.
const state = {
  currentProfile: window.sessionStorage.getItem('_awsProfile') || 'default',
  containers: [],
  containerState: [],
  containerImages: [],
  clusters: [],
  clusterState: {},
  activeCluster: "",
  error: "",
  profileNames: [],
  modalState: false,
  modalProfile: "",
  modalStats: ""
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
  updateClusters(state, clusters) {
    state.clusters = clusters
  },
  updateClusterState(state, clusterDetails) {
    console.log(clusterDetails)
    let newObj = {}
    newObj[clusterDetails.clusterName] = clusterDetails

    state.clusterState = assignIn(clone(state.clusterState), newObj)
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
  setCluster(state, clusterName) {
    state.activeCluster = clusterName
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
  },
  modalStats(state, obj) {
    state.modalStats = obj.container
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
  updateClusters({commit, state}) {
    return Vue.http.get(`http://${process.env.API_HOST}/aws/clusters`).then(res => {
      commit('updateClusters', res.body)
    }).catch(err => {
      console.log(err)
      commit('err', err)
    })
  },
  setClusterActive({commit, state}, clusterName) {
    commit('setCluster', clusterName)
    return Vue.http.get(`http://${process.env.API_HOST}/aws/cluster/${clusterName}`).then(res => {
      commit('updateClusterState', res.body)
    }).catch(err => {
      commit('err', err)
    })
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
    console.log('get current profile')
    return Vue.http.get(`http://${process.env.API_HOST}/aws/currentProfile`).then(res => {
      commit('updateProfileName', res.body.profileName)
    }).catch(err => {
      commit('err', err)
    })
  },
  getProfileNames({commit, state}) {
    return Vue.http.get(`http://${process.env.API_HOST}/aws/profiles`).then(res => {
      console.log(res.body)
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
    commit('modalStats', false)
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
  openStats({commit, state}, container) {
    commit('modalSet', true)
    commit('modalStats', {container: container})
  },
  submitMFA({commit, state}, mfa) {
    return Vue.http.post(`http://${process.env.API_HOST}/aws/submitmfa`, {"mfa": mfa, "profile": state.modalProfile})
  },
  // assumeRole({commit, state}) {
  //   Vue.http.post(`http://${process.env.API_HOST}/aws/assumerole`).then(res => {
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
  clusterObjects: state => {
    return map(state.clusters, (val) => {
      return {
        arn: val,
        clusterName: last(val.split('/')),
        region: val.split(':')[3],
        account: val.split(':')[4]
      }
    })
  },
  currentCluster: state => {
    return find(state.clusterState, (val) => {
      return val.clusterName === state.activeCluster
    })
  },
  currentServices: (state, getters) => {
    return chain(getters.currentCluster).find((val, key) => {
      return key === 'services'
    }).sortBy('serviceName').value()
  },
  currentInstances: (state, getters) => {
    return find(getters.currentCluster, (val, key) => {
      return key === 'instances'
    })
  }
}

// A Vuex instance is created by combining the state, mutations, actions,
// and getters.
export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
