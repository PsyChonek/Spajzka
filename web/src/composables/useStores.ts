import { storeToRefs } from 'pinia'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useMealPlanStore } from '@/stores/mealPlanStore'

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
 * Composable that provides easy access to meal-plan store with reactive refs.
 */
export function useMealPlan() {
  const store = useMealPlanStore()
  const {
    entries,
    sortedEntries,
    entriesByDate,
    entriesExpandedByEatDate,
    rangeStart,
    rangeEnd,
    loading,
    lastSynced,
    hasPendingChanges
  } = storeToRefs(store)

  return {
    // Reactive state
    entries,
    sortedEntries,
    entriesByDate,
    entriesExpandedByEatDate,
    rangeStart,
    rangeEnd,
    loading,
    lastSynced,
    hasPendingChanges,

    // Actions
    fetchItems: store.fetchItems,
    fetchRange: store.fetchRange,
    addEntry: store.addEntry,
    updateEntry: store.updateEntry,
    deleteEntry: store.deleteEntry,
    previewShopping: store.previewShopping,
    generateShopping: store.generateShopping,
    syncPendingChanges: store.syncPendingChanges
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
