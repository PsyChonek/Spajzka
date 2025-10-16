import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ShoppingService, type ShoppingItem, type CreateShoppingItemRequest, ApiError } from '@/api-client'
import { isOnline } from '@/utils/network'
import { Notify } from 'quasar'
import { useGroupsStore } from './groupsStore'
import { useItemsStore } from './itemsStore'

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([])
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
      return
    }

    loading.value = true
    try {
      const fetchedItems = await ShoppingService.getApiShopping()
      items.value = fetchedItems
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
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

  async function addItem(itemData: CreateShoppingItemRequest) {
    const tempId = `temp_${Date.now()}`

    // Get item details from the items store to populate the temporary item
    const itemsStore = useItemsStore()
    const itemDetails = itemsStore.getItem(itemData.itemId, itemData.itemType as 'global' | 'group')

    // Create a temporary shopping item with populated details
    const tempItem: ShoppingItem = {
      _id: tempId,
      itemId: itemData.itemId,
      itemType: itemData.itemType as ShoppingItem.itemType,
      quantity: itemData.quantity ?? 1,
      completed: false,
      name: itemDetails?.name || 'Loading...',
      category: itemDetails?.category,
      icon: itemDetails?.icon,
      defaultUnit: itemDetails?.defaultUnit,
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
          // For create, send only the required fields
          const createData: CreateShoppingItemRequest = {
            itemId: item.itemId!,
            itemType: item.itemType as CreateShoppingItemRequest.itemType,
            quantity: item.quantity
          }
          const savedItem = await ShoppingService.postApiShopping(createData)
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

  function $reset() {
    items.value = []
    loading.value = false
    lastSynced.value = null
    pendingChanges.value.clear()
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
    syncPendingChanges,
    $reset
  }
}, {
  persist: true
})
