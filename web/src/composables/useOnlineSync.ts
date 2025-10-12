import { onMounted, onUnmounted } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'

let isInitialized = false

export function useOnlineSync() {
  const pantryStore = usePantryStore()
  const shoppingStore = useShoppingStore()

  const handleOnline = async () => {
    console.log('Back online - syncing pending changes...')
    
    // Sync both stores
    await Promise.all([
      pantryStore.syncPendingChanges(),
      shoppingStore.syncPendingChanges()
    ])

    // Fetch latest data from server
    await Promise.all([
      pantryStore.fetchItems(),
      shoppingStore.fetchItems()
    ])
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
      pantryStore.fetchItems()
      shoppingStore.fetchItems()
    }
  })

  onUnmounted(() => {
    // Don't remove listeners as they should persist across views
  })

  return {
    isOnline: () => navigator.onLine
  }
}
