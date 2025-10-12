import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ItemsService, type Item, isOnline, ApiError } from '@/services/api'
import { Notify } from 'quasar'

// Export ItemsService and Item type from api
export { ItemsService, type Item } from '@/services/api'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
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
      console.log('Offline: Using cached items')
      return
    }

    loading.value = true
    try {
      const fetchedItems = await ItemsService.getApiItems()
      items.value = fetchedItems
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
      console.error('Failed to fetch items:', error)
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

  async function addItem(itemData: Omit<Item, '_id' | 'createdAt' | 'updatedAt'>) {
    // Create temporary item for immediate UI update
    const tempId = `temp_${Date.now()}`
    const tempItem: Item = {
      _id: tempId,
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    items.value.push(tempItem)

    // Try to sync with server if online
    if (isOnline()) {
      try {
        const savedItem = await ItemsService.postApiItems(itemData)
        // Replace temp item with server item
        const index = items.value.findIndex((i: Item) => i._id === tempId)
        if (index !== -1) {
          items.value[index] = savedItem
        }
        lastSynced.value = new Date()
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (is404) {
          console.log('API endpoint not available - using local storage only')
        } else {
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
      pendingChanges.value.set(tempId, 'create')
      Notify.create({
        type: 'info',
        message: 'Item saved locally. Will sync when online.',
        timeout: 2000
      })
    }
  }

  async function updateItem(id: string, updates: Partial<Item>) {
    // Update locally first
    const item = items.value.find((i: Item) => i._id === id)
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() })

      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          const updatedItem = await ItemsService.putApiItems(id, updates as any)
          Object.assign(item, updatedItem)
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (is404) {
            console.log('API endpoint not available - using local storage only')
          } else {
            console.error('Failed to update item on server:', error)
            pendingChanges.value.set(id, 'update')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        pendingChanges.value.set(id, 'update')
      }
    }
  }

  async function deleteItem(id: string) {
    // Delete locally first
    const index = items.value.findIndex((i: Item) => i._id === id)
    if (index !== -1) {
      items.value.splice(index, 1)

      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          await ItemsService.deleteApiItems(id)
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (is404) {
            console.log('API endpoint not available - using local storage only')
          } else {
            console.error('Failed to delete item on server:', error)
            pendingChanges.value.set(id, 'delete')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
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
        const item = items.value.find((i: Item) => i._id === id)

        if (action === 'create' && item) {
          const { _id, ...itemData } = item
          const savedItem = await ItemsService.postApiItems(itemData)
          const index = items.value.findIndex((i: Item) => i._id === id)
          if (index !== -1) {
            items.value[index] = savedItem
          }
        } else if (action === 'update' && item && !id.startsWith('temp_')) {
          const { _id, ...updates } = item
          await ItemsService.putApiItems(id, updates)
        } else if (action === 'delete' && !id.startsWith('temp_')) {
          await ItemsService.deleteApiItems(id)
        }

        pendingChanges.value.delete(id)
      } catch (error: any) {
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
    syncPendingChanges
  }
}, {
  persist: true
})
