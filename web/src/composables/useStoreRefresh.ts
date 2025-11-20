import { useAuthStore } from '@/stores/authStore'
import { useGroupsStore } from '@/stores/groupsStore'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useRecipesStore } from '@/stores/recipesStore'

// Cooldown configuration (in milliseconds)
const REFRESH_COOLDOWN_MS = 5000 // 5 seconds

// Track last refresh times
let lastRefreshAllStores = 0
let lastRefreshUserAndPermissions = 0
let lastRefreshGroupStores = 0

/**
 * Composable that provides centralized store refresh functionality
 * Use this to refresh all stores after login, logout, or page navigation
 */
export function useStoreRefresh() {
  const authStore = useAuthStore()
  const groupsStore = useGroupsStore()
  const pantryStore = usePantryStore()
  const shoppingStore = useShoppingStore()
  const itemsStore = useItemsStore()
  const recipesStore = useRecipesStore()

  /**
   * Refresh all stores - fetches fresh data for authenticated users
   * This should be called on:
   * - Login success
   * - Page navigation (to ensure fresh data)
   * - Coming back online
   * 
   * Includes cooldown to prevent API spam (5 second minimum between refreshes)
   */
  async function refreshAllStores() {
    // Wait for auth to be initialized
    if (!authStore.initialized) {
      console.log('Skipping refresh - auth not yet initialized')
      return
    }

    // If not authenticated, don't fetch (user needs to authenticate first)
    if (!authStore.isAuthenticated) {
      console.log('Skipping refresh - user not authenticated')
      return
    }

    // Check cooldown to prevent API spam
    const now = Date.now()
    if (now - lastRefreshAllStores < REFRESH_COOLDOWN_MS) {
      console.log('Skipping refresh - cooldown period active')
      return
    }
    lastRefreshAllStores = now

    // Fetch user data to get latest permissions
    await authStore.fetchUser()

    // Fetch groups first (other stores may depend on current group)
    await groupsStore.fetchGroups()

    // Fetch all other stores in parallel
    await Promise.all([
      itemsStore.fetchItems(),
      pantryStore.fetchItems(),
      shoppingStore.fetchItems(),
      recipesStore.fetchItems()
    ])
  }

  /**
   * Refresh only the current user's data and permissions
   * Lighter weight than refreshAllStores
   * 
   * Includes cooldown to prevent API spam (5 second minimum between refreshes)
   */
  async function refreshUserAndPermissions() {
    if (!authStore.isAuthenticated) {
      return
    }

    // Check cooldown to prevent API spam
    const now = Date.now()
    if (now - lastRefreshUserAndPermissions < REFRESH_COOLDOWN_MS) {
      console.log('Skipping user/permissions refresh - cooldown period active')
      return
    }
    lastRefreshUserAndPermissions = now

    await authStore.fetchUser()
  }

  /**
   * Refresh group-dependent stores (pantry, shopping, items)
   * Call this after group selection changes
   * 
   * Includes cooldown to prevent API spam (5 second minimum between refreshes)
   */
  async function refreshGroupStores() {
    if (!authStore.isAuthenticated) {
      return
    }

    // Check cooldown to prevent API spam
    const now = Date.now()
    if (now - lastRefreshGroupStores < REFRESH_COOLDOWN_MS) {
      console.log('Skipping group stores refresh - cooldown period active')
      return
    }
    lastRefreshGroupStores = now

    await Promise.all([
      itemsStore.fetchItems(),
      pantryStore.fetchItems(),
      shoppingStore.fetchItems(),
      recipesStore.fetchItems()
    ])
  }

  return {
    refreshAllStores,
    refreshUserAndPermissions,
    refreshGroupStores
  }
}
