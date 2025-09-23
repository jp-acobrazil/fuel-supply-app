import { createRouter, createWebHistory } from 'vue-router'
import DriverHome from '../views/DriverHome.vue'
import Supply from '../views/Supply.vue'

const routes = [
  { path: '/', name: 'home', component: DriverHome },
  { path: '/supply', name: 'supply', component: Supply },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
