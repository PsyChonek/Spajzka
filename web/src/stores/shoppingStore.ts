import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ShoppingService, type ShoppingItem, isOnline, ApiError } from '@/services/api'
import { Notify } from 'quasar'

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())

  // Computed
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return new Date(b.updatedAt || b.createdAt || '').getTime() - 
        new Date(a.updatedAt || a.createdAt || '').getTime()
    })
  })

  const activeItems = computed(() => {
    return sortedItems.value.filter(item => !item.completed)
  })

  const completedItems = computed(() => {
    return sortedItems.value.filter(item => item.completed)
  })

  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  async function fetchItems() {
    if (!isOnline()) {
      console.log('Offline: Using cached shopping items')
      return
    }

    loading.value = true
    try {
      const fetchedItems = await ShoppingService.getApiShopping()
      items.value = fetchedItems
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
      console.error('Failed to fetch shopping items:', error)
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

  async function addItem(itemData: Omit<ShoppingItem, '_id' | 'createdAt' | 'updatedAt'>) {
    const tempId = `temp_${Date.now()}`
    const tempItem: ShoppingItem = {
      _id: tempId,
      ...itemData,
      completed: itemData.completed ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    items.value.push(tempItem)

    if (isOnline()) {
      try {
        const savedItem = await ShoppingService.postApiShopping(itemData)
        const index = items.value.findIndex((i: ShoppingItem) => i._id === tempId)
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

  async function updateItem(id: string, updates: Partial<ShoppingItem>) {
    const item = items.value.find((i: ShoppingItem) => i._id === id)
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() })

      if (isOnline() && !id.startsWith('temp_')) {
        try {
          const updatedItem = await ShoppingService.putApiShopping(id, updates as any)
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
    const index = items.value.findIndex((i: ShoppingItem) => i._id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          await ShoppingService.deleteApiShopping(id)
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

  async function toggleItem(id: string) {
    const item = items.value.find((i: ShoppingItem) => i._id === id)
    if (item) {
      await updateItem(id, { completed: !item.completed })
    }
  }

  async function syncPendingChanges() {
    if (!isOnline() || pendingChanges.value.size === 0) {
      return
    }

    const changes = Array.from(pendingChanges.value.entries())
    
    for (const [id, action] of changes) {
      try {
        const item = items.value.find((i: ShoppingItem) => i._id === id)
        
        if (action === 'create' && item) {
          const { _id, ...itemData } = item
          const savedItem = await ShoppingService.postApiShopping(itemData)
          const index = items.value.findIndex((i: ShoppingItem) => i._id === id)
          if (index !== -1) {
            items.value[index] = savedItem
          }
        } else if (action === 'update' && item && !id.startsWith('temp_')) {
          const { _id, ...updates } = item
          await ShoppingService.putApiShopping(id, updates as any)
        } else if (action === 'delete' && !id.startsWith('temp_')) {
          await ShoppingService.deleteApiShopping(id)
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
    activeItems,
    completedItems,
    loading,
    lastSynced,
    hasPendingChanges,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    syncPendingChanges
  }
}, {
  persist: true
})
