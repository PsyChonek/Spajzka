import { storeToRefs } from 'pinia'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'

/**
 * Composable that provides easy access to pantry store with reactive refs
 */
export function usePantry() {
  const store = usePantryStore()
  const { items, sortedItems, loading, lastSynced, hasPendingChanges } = storeToRefs(store)

  return {
    // Reactive state
    items,
    sortedItems,
    loading,
    lastSynced,
    hasPendingChanges,
    
    // Actions
    fetchItems: store.fetchItems,
    addItem: store.addItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    syncPendingChanges: store.syncPendingChanges,
    incrementQuantity: store.incrementQuantity,
    decrementQuantity: store.decrementQuantity,
  }
}

/**
 * Composable that provides easy access to shopping store with reactive refs
 */
export function useShopping() {
  const store = useShoppingStore()
  const { 
    items, 
    sortedItems, 
    activeItems, 
    completedItems, 
    loading, 
    lastSynced, 
    hasPendingChanges 
  } = storeToRefs(store)

  return {
    // Reactive state
    items,
    sortedItems,
    activeItems,
    completedItems,
    loading,
    lastSynced,
    hasPendingChanges,

    // Actions
    fetchItems: store.fetchItems,
    addItem: store.addItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    toggleItem: store.toggleItem,
    syncPendingChanges: store.syncPendingChanges,
  }
}
