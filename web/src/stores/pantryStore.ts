import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PantryService, type PantryItem, isOnline, ApiError } from '@/services/api'
import { Notify } from 'quasar'

export const usePantryStore = defineStore('pantry', () => {
  const items = ref<PantryItem[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())

  // Computed
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => 
      new Date(b.updatedAt || b.createdAt || '').getTime() - 
      new Date(a.updatedAt || a.createdAt || '').getTime()
    )
  })

  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  // Actions
  async function fetchItems() {
    if (!isOnline()) {
      console.log('Offline: Using cached pantry items')
      return
    }

    loading.value = true
    try {
      const fetchedItems = await PantryService.getApiPantry()
      items.value = fetchedItems
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
      console.error('Failed to fetch pantry items:', error)
      // Only show notification if it's not a 404 (API might not be set up yet)
      const is404 = error instanceof ApiError && error.status === 404
      if (!is404 && error.message !== 'offline') {
        Notify.create({
          type: 'warning',
          message: 'Using cached data. Will sync when online.',
          timeout: 2000
        })
      } else if (is404) {
        console.log('API endpoint not found - using local data only')
      }
    } finally {
      loading.value = false
    }
  }

  async function addItem(itemData: Omit<PantryItem, '_id' | 'createdAt' | 'updatedAt'>) {
    // Create temporary item for immediate UI update
    const tempId = `temp_${Date.now()}`
    const tempItem: PantryItem = {
      _id: tempId,
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    items.value.push(tempItem)

    // Try to sync with server if online
    if (isOnline()) {
      try {
        const savedItem = await PantryService.postApiPantry(itemData)
        // Replace temp item with server item
        const index = items.value.findIndex((i: PantryItem) => i._id === tempId)
        if (index !== -1) {
          items.value[index] = savedItem
        }
        lastSynced.value = new Date()
      } catch (error: any) {
        // If 404, API doesn't exist - just use local data, don't queue
        const is404 = error instanceof ApiError && error.status === 404
        if (is404) {
          console.log('API endpoint not available - using local storage only')
        } else {
          // For other errors, mark as pending for retry
          console.error('Failed to create item on server:', error)
          pendingChanges.value.set(tempId, 'create')
          Notify.create({
            type: 'warning',
            message: 'Item saved locally. Will sync when online.',
            timeout: 2000
          })
        }
      }
    } else {
      // Offline - queue for sync
      pendingChanges.value.set(tempId, 'create')
      Notify.create({
        type: 'info',
        message: 'Item saved locally. Will sync when online.',
        timeout: 2000
      })
    }
  }

  async function updateItem(id: string, updates: Partial<PantryItem>) {
    // Update locally first
    const item = items.value.find((i: PantryItem) => i._id === id)
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() })

      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          const updatedItem = await PantryService.putApiPantry(id, updates as any)
          Object.assign(item, updatedItem)
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          // If 404, API doesn't exist - just use local data
          const is404 = error instanceof ApiError && error.status === 404
          if (is404) {
            console.log('API endpoint not available - using local storage only')
          } else {
            // For other errors, mark as pending for retry
            console.error('Failed to update item on server:', error)
            pendingChanges.value.set(id, 'update')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        // Offline - queue for sync
        pendingChanges.value.set(id, 'update')
      }
    }
  }

  async function deleteItem(id: string) {
    // Delete locally first
    const index = items.value.findIndex((i: PantryItem) => i._id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      
      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          await PantryService.deleteApiPantry(id)
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          // If 404, API doesn't exist - just use local data
          const is404 = error instanceof ApiError && error.status === 404
          if (is404) {
            console.log('API endpoint not available - using local storage only')
          } else {
            // For other errors, mark as pending for retry
            console.error('Failed to delete item on server:', error)
            pendingChanges.value.set(id, 'delete')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        // Offline - queue for sync
        pendingChanges.value.set(id, 'delete')
      }
    }
  }

  async function syncPendingChanges() {
    if (!isOnline() || pendingChanges.value.size === 0) {
      return
    }

    const changes = Array.from(pendingChanges.value.entries())
    
    for (const [id, action] of changes) {
      try {
        const item = items.value.find((i: PantryItem) => i._id === id)
        
        if (action === 'create' && item) {
          const { _id, ...itemData } = item
          const savedItem = await PantryService.postApiPantry(itemData)
          // Replace temp item with server item
          const index = items.value.findIndex((i: PantryItem) => i._id === id)
          if (index !== -1) {
            items.value[index] = savedItem
          }
        } else if (action === 'update' && item && !id.startsWith('temp_')) {
          const { _id, ...updates } = item
          await PantryService.putApiPantry(id, updates)
        } else if (action === 'delete' && !id.startsWith('temp_')) {
          await PantryService.deleteApiPantry(id)
        }
        
        pendingChanges.value.delete(id)
      } catch (error: any) {
        // Skip 404 errors (API not ready)
        const is404 = error instanceof ApiError && error.status === 404
        if (is404) {
          console.log(`API endpoint not available for ${action} operation`)
          pendingChanges.value.delete(id)
        } else {
          console.error(`Failed to sync ${action} for item ${id}:`, error)
        }
      }
    }

    if (pendingChanges.value.size === 0) {
      lastSynced.value = new Date()
      Notify.create({
        type: 'positive',
        message: 'All changes synced successfully',
        timeout: 1500
      })
    }
  }

  function incrementQuantity(id: string) {
    const item = items.value.find((i: PantryItem) => i._id === id)
    if (item) {
      updateItem(id, { quantity: item.quantity + 1 })
    }
  }

  function decrementQuantity(id: string) {
    const item = items.value.find((i: PantryItem) => i._id === id)
    if (item && item.quantity > 0) {
      updateItem(id, { quantity: item.quantity - 1 })
    }
  }

  return {
    items,
    sortedItems,
    loading,
    lastSynced,
    hasPendingChanges,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    syncPendingChanges,
    incrementQuantity,
    decrementQuantity
  }
}, {
  persist: true
})
