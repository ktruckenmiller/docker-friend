import Vue from 'vue'
import Router from 'vue-router'

import Cloud from 'components/Cloud'
import Containers from 'components/Containers'
import Images from 'components/Images'

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
      path: '/cloud',
      name: 'Cloud',
      component: Cloud
    }
  ]
})
