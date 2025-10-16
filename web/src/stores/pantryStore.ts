import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { PantryService, type PantryItem, type CreatePantryItemRequest, ApiError } from '@/api-client'
import { isOnline } from '@/utils/network'
import { Notify } from 'quasar'
import { useGroupsStore } from './groupsStore'
import { useItemsStore } from './itemsStore'

export const usePantryStore = defineStore('pantry', () => {
  const items = ref<PantryItem[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())

  // Watch for group changes and refetch items
  const groupsStore = useGroupsStore()
  watch(() => groupsStore.currentGroupId, (newGroupId, oldGroupId) => {
    if (newGroupId && newGroupId !== oldGroupId) {
      fetchItems()
    }
  }, { immediate: false })

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
      return
    }

    loading.value = true
    try {
      const fetchedItems = await PantryService.getApiPantry()
      items.value = fetchedItems
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
      // Only show notification if it's not a 404 (API might not be set up yet)
      const is404 = error instanceof ApiError && error.status === 404
      if (!is404 && error.message !== 'offline') {
        Notify.create({
          type: 'warning',
          message: 'Using cached data. Will sync when online.',
          timeout: 2000
        })
      } else if (is404) {
      }
    } finally {
      loading.value = false
    }
  }

  async function addItem(itemData: CreatePantryItemRequest) {
    // Create temporary item for immediate UI update
    const tempId = `temp_${Date.now()}`

    // Get item details from the items store to populate the temporary item
    const itemsStore = useItemsStore()
    const itemDetails = itemsStore.getItem(itemData.itemId, itemData.itemType as 'global' | 'group')

    const tempItem: PantryItem = {
      _id: tempId,
      itemId: itemData.itemId,
      itemType: itemData.itemType as PantryItem.itemType,
      quantity: itemData.quantity,
      name: itemDetails?.name || 'Loading...',
      category: itemDetails?.category,
      icon: itemDetails?.icon,
      defaultUnit: itemDetails?.defaultUnit,
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

        if (action === 'create' && item && item.itemId && item.itemType && item.quantity !== undefined) {
          const itemData: CreatePantryItemRequest = {
            itemId: item.itemId,
            itemType: item.itemType as CreatePantryItemRequest.itemType,
            quantity: item.quantity
          }
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
    if (item && item.quantity !== undefined) {
      updateItem(id, { quantity: item.quantity + 1 })
    }
  }

  function decrementQuantity(id: string) {
    const item = items.value.find((i: PantryItem) => i._id === id)
    if (item && item.quantity !== undefined && item.quantity > 0) {
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
