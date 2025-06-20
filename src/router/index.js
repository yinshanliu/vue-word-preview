import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/manual',
    name: 'Manual',
    component: () => import('../views/Manual.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 