import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/pantry-list',
    name: 'Pantry List',
    component: () => import('../views/PantryListView.vue')
  },
  {
    path: '/shopping-list',
    name: 'Shopping List',
    component: () => import('../views/ShoppingListView.vue')
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('../views/ItemsManagementView.vue')
  },
  {
    path: '/auth-test',
    name: 'Auth Test',
    component: () => import('../views/AuthTestView.vue')
  },
  {
    path: '/examples',
    name: 'Examples',
    component: () => import('../views/ExamplesView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
