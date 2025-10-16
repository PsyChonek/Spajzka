import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/pantry',
    name: 'Pantry',
    component: () => import('../views/PantryView.vue')
  },
  {
    path: '/shopping',
    name: 'Shopping',
    component: () => import('../views/ShoppingView.vue')
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('../views/ItemsView.vue')
  },
  {
    path: '/groups',
    name: 'Groups',
    component: () => import('../views/GroupsView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
