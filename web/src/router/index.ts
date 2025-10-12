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
