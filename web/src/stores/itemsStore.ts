import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ItemsService, ApiError, type GlobalItem as ApiGlobalItem, type GroupItem as ApiGroupItem } from '@/api-client'
import { isOnline } from '@/utils/network'
import { Notify } from 'quasar'
import { useAuthStore } from './authStore'
import { useGroupsStore } from './groupsStore'

// Extended types for store use
export interface GlobalItem extends ApiGlobalItem {
  type?: 'global'
}

export interface GroupItem extends ApiGroupItem {
  type?: 'group'
}

// Combined item type for use in pantry/shopping
export type Item = (GlobalItem | GroupItem) & { type: 'global' | 'group' }

export const useItemsStore = defineStore('items', () => {
  const authStore = useAuthStore()
  const groupsStore = useGroupsStore()
  const globalItems = ref<GlobalItem[]>([])
  const groupItems = ref<GroupItem[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())

  // Watch for group changes and refetch items
  watch(() => groupsStore.currentGroupId, (newGroupId, oldGroupId) => {
    if (newGroupId && newGroupId !== oldGroupId) {
      fetchItems()
    }
  }, { immediate: false })

  // Computed
  const allItems = computed<Item[]>(() => {
    return [
      ...globalItems.value.map(item => ({ ...item, type: 'global' as const })),
      ...groupItems.value.map(item => ({ ...item, type: 'group' as const }))
    ]
  })

  const sortedItems = computed(() => {
    return [...allItems.value].sort((a, b) => {
      const categoryA = a.category || ''
      const categoryB = b.category || ''
      const categoryCompare = categoryA.localeCompare(categoryB)
      if (categoryCompare !== 0) return categoryCompare
      return (a.name || '').localeCompare(b.name || '')
    })
  })

  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  // Actions
  async function fetchItems() {
    if (!isOnline()) {
      return
    }

    loading.value = true
    try {
      const response = await ItemsService.getApiItems()
      globalItems.value = (response.globalItems || []).map(item => ({ ...item, type: 'global' as const }))
      groupItems.value = (response.groupItems || []).map(item => ({ ...item, type: 'group' as const }))
      lastSynced.value = new Date()
      pendingChanges.value.clear()
    } catch (error: any) {
      console.error('Failed to fetch items:', error)
      const is404 = error instanceof ApiError && error.status === 404
      if (!is404 && error.message !== 'offline' && authStore.isAuthenticated) {
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

  async function fetchGlobalItems() {
    if (!isOnline()) {
      return
    }

    loading.value = true
    try {
      const items = await ItemsService.getApiItemsGlobal()
      globalItems.value = items.map(item => ({ ...item, type: 'global' as const }))
      lastSynced.value = new Date()
    } catch (error: any) {
    } finally {
      loading.value = false
    }
  }

  async function fetchGroupItems() {
    if (!isOnline()) {
      return
    }

    loading.value = true
    try {
      const items = await ItemsService.getApiItemsGroup()
      groupItems.value = items.map(item => ({ ...item, type: 'group' as const }))
      lastSynced.value = new Date()
    } catch (error: any) {
    } finally {
      loading.value = false
    }
  }

  async function addGroupItem(itemData: Omit<GroupItem, '_id' | 'groupId' | 'createdBy' | 'createdAt'>) {
    // Create temporary item for immediate UI update
    const tempId = `temp_${Date.now()}`
    const tempItem: GroupItem = {
      _id: tempId,
      groupId: 'temp',
      ...itemData,
      createdBy: authStore.user?._id || 'temp',
      createdAt: new Date().toISOString(),
      type: 'group'
    }

    groupItems.value.push(tempItem)

    // Try to sync with server if online
    if (isOnline()) {
      try {
        const savedItem = await ItemsService.postApiItemsGroup(itemData as any)
        // Replace temp item with server item
        const index = groupItems.value.findIndex((i) => i._id === tempId)
        if (index !== -1) {
          groupItems.value[index] = { ...savedItem, type: 'group' } as GroupItem
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

  async function updateGroupItem(id: string, updates: Partial<GroupItem>) {
    // Update locally first
    const item = groupItems.value.find((i) => i._id === id)
    if (item) {
      Object.assign(item, updates)

      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          const updatedItem = await ItemsService.putApiItemsGroup(id, updates as any)
          Object.assign(item, updatedItem, { type: 'group' })
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

  async function deleteGroupItem(id: string) {
    // Delete locally first
    const index = groupItems.value.findIndex((i) => i._id === id)
    if (index !== -1) {
      groupItems.value.splice(index, 1)

      // Try to sync with server
      if (isOnline() && !id.startsWith('temp_')) {
        try {
          await ItemsService.deleteApiItemsGroup(id)
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

  async function addGlobalItem(itemData: Omit<GlobalItem, '_id' | 'createdBy' | 'createdAt' | 'isActive'>) {
    if (!isOnline()) {
      Notify.create({
        type: 'warning',
        message: 'Must be online to create global items',
        timeout: 2000
      })
      return
    }

    try {
      const savedItem = await ItemsService.postApiItemsGlobal(itemData as any)
      globalItems.value.push({ ...savedItem, type: 'global' } as GlobalItem)
      lastSynced.value = new Date()
      Notify.create({
        type: 'positive',
        message: 'Global item created successfully',
        timeout: 2000
      })
    } catch (error: any) {
      const is403 = error instanceof ApiError && error.status === 403
      if (is403) {
        Notify.create({
          type: 'negative',
          message: 'Permission denied: You do not have permission to create global items',
          timeout: 3000
        })
      } else {
        console.error('Failed to create global item:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to create global item',
          timeout: 2000
        })
      }
    }
  }

  async function updateGlobalItem(id: string, updates: Partial<GlobalItem>) {
    if (!isOnline()) {
      Notify.create({
        type: 'warning',
        message: 'Must be online to update global items',
        timeout: 2000
      })
      return
    }

    try {
      const updatedItem = await ItemsService.putApiItemsGlobal(id, updates as any)
      const item = globalItems.value.find((i) => i._id === id)
      if (item) {
        Object.assign(item, updatedItem, { type: 'global' })
      }
      lastSynced.value = new Date()
      Notify.create({
        type: 'positive',
        message: 'Global item updated successfully',
        timeout: 2000
      })
    } catch (error: any) {
      const is403 = error instanceof ApiError && error.status === 403
      if (is403) {
        Notify.create({
          type: 'negative',
          message: 'Permission denied: You do not have permission to update global items',
          timeout: 3000
        })
      } else {
        console.error('Failed to update global item:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to update global item',
          timeout: 2000
        })
      }
    }
  }

  async function deleteGlobalItem(id: string) {
    if (!isOnline()) {
      Notify.create({
        type: 'warning',
        message: 'Must be online to delete global items',
        timeout: 2000
      })
      return
    }

    try {
      await ItemsService.deleteApiItemsGlobal(id)
      const index = globalItems.value.findIndex((i) => i._id === id)
      if (index !== -1) {
        globalItems.value.splice(index, 1)
      }
      lastSynced.value = new Date()
      Notify.create({
        type: 'positive',
        message: 'Global item deleted successfully',
        timeout: 2000
      })
    } catch (error: any) {
      const is403 = error instanceof ApiError && error.status === 403
      if (is403) {
        Notify.create({
          type: 'negative',
          message: 'Permission denied: You do not have permission to delete global items',
          timeout: 3000
        })
      } else {
        console.error('Failed to delete global item:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to delete global item',
          timeout: 2000
        })
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
        const item = groupItems.value.find((i) => i._id === id)

        if (action === 'create' && item) {
          const { _id, groupId, createdBy, type, ...itemData } = item
          const savedItem = await ItemsService.postApiItemsGroup(itemData as any)
          const index = groupItems.value.findIndex((i) => i._id === id)
          if (index !== -1) {
            groupItems.value[index] = { ...savedItem, type: 'group' } as GroupItem
          }
        } else if (action === 'update' && item && !id.startsWith('temp_')) {
          const { _id, groupId, createdBy, type, ...updates } = item
          await ItemsService.putApiItemsGroup(id, updates)
        } else if (action === 'delete' && !id.startsWith('temp_')) {
          await ItemsService.deleteApiItemsGroup(id)
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

  // Get item by ID and type
  function getItem(id: string, type: 'global' | 'group'): Item | undefined {
    if (type === 'global') {
      const item = globalItems.value.find(i => i._id === id)
      return item ? { ...item, type: 'global' } : undefined
    } else {
      const item = groupItems.value.find(i => i._id === id)
      return item ? { ...item, type: 'group' } : undefined
    }
  }

  return {
    globalItems,
    groupItems,
    allItems,
    sortedItems,
    loading,
    lastSynced,
    hasPendingChanges,
    fetchItems,
    fetchGlobalItems,
    fetchGroupItems,
    addGroupItem,
    updateGroupItem,
    deleteGroupItem,
    addGlobalItem,
    updateGlobalItem,
    deleteGlobalItem,
    syncPendingChanges,
    getItem
  }
}, {
  persist: true
})
