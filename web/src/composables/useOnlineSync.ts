import { onMounted, onUnmounted } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useRecipesStore } from '@/stores/recipesStore'
import { useStoreRefresh } from '@/composables/useStoreRefresh'

let isInitialized = false

export function useOnlineSync() {
  const pantryStore = usePantryStore()
  const shoppingStore = useShoppingStore()
  const itemsStore = useItemsStore()
  const recipesStore = useRecipesStore()
  const { refreshAllStores } = useStoreRefresh()

  const handleOnline = async () => {
    console.log('Back online - syncing pending changes...')

    // Sync pending changes first
    await Promise.all([
      pantryStore.syncPendingChanges(),
      shoppingStore.syncPendingChanges(),
      itemsStore.syncPendingChanges(),
      recipesStore.syncPendingChanges()
    ])

    // Fetch latest data from server to ensure everything is up to date
    await refreshAllStores()
  }

  const handleOffline = () => {
    console.log('Gone offline - will queue changes locally')
  }

  onMounted(() => {
    // Only initialize once globally
    if (isInitialized) {
      return
    }
    
    isInitialized = true
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial fetch if online
    if (navigator.onLine) {
      refreshAllStores()
    }
  })

  onUnmounted(() => {
    // Don't remove listeners as they should persist across views
  })

  return {
    isOnline: () => navigator.onLine
  }
}
