import Vue from 'vue'
import Router from 'vue-router'

import Cloud from 'components/Cloud'
import Containers from 'components/Containers'
import Images from 'components/Images'

import Clusters from 'components/cloud/Clusters'
import Services from 'components/cloud/Services'
import Domains from 'components/cloud/Domains'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', redirect: '/local'},
    { path: '/local', redirect: '/local/containers' },
    {
      path: '/local/containers',
      name: 'Containers',
      component: Containers
    },{
      path: '/local/images',
      name: 'Images',
      component: Images
    },{
      path: '/cloud', redirect: '/cloud/clusters'
    },{
      path: '/cloud/clusters',
      name: 'Clusters',
      props: { pageName: 'clusters' },
      component: Clusters
    }, {
      path: '/cloud/services',
      name: 'Services',
      props: { pageName: 'services' },
      component: Services
    },{
      path: '/cloud/domains',
      name: 'Domains',
      component: Domains
    }
  ]
})
