import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useStoreRefresh } from '@/composables/useStoreRefresh'

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
    path: '/recipes',
    name: 'Recipes',
    component: () => import('../views/RecipesView.vue')
  },
  {
    path: '/cook',
    name: 'Cook',
    component: () => import('../views/CookView.vue')
  },
  {
    path: '/cook/:recipeId',
    name: 'CookRecipe',
    component: () => import('../views/CookView.vue')
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

// Add navigation guard to refresh stores on each page navigation
router.beforeEach(async (to, from) => {
  // Only refresh if navigating to a different route
  if (to.path !== from.path) {
    // Ensure auth is initialized before trying to refresh stores
    const { useAuthStore } = await import('@/stores/authStore')
    const authStore = useAuthStore()
    
    // Wait for auth initialization to complete
    if (!authStore.initialized) {
      await authStore.initialize()
    }
    
    // Now refresh all stores
    const { refreshAllStores } = useStoreRefresh()
    await refreshAllStores()
  }
})

export default router
