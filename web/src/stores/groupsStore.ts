import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { GroupsService, AuthenticationService, type Group, ApiError } from '@/api-client'
import { Notify } from 'quasar'

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<Group[]>([])
  const currentGroupId = ref<string | null>(null)
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)

  // Computed
  const currentGroup = computed(() => {
    if (!currentGroupId.value) return null
    return groups.value.find(g => g._id === currentGroupId.value) || null
  })

  const sortedGroups = computed(() => {
    return [...groups.value].sort((a, b) => {
      // Personal groups first
      if (a.isPersonal !== b.isPersonal) {
        return a.isPersonal ? -1 : 1
      }
      // Then alphabetically
      return (a.name || '').localeCompare(b.name || '')
    })
  })

  // Actions
  async function fetchGroups() {
    loading.value = true
    try {
      const fetchedGroups = await GroupsService.getApiGroupsMy()
      groups.value = fetchedGroups
      lastSynced.value = new Date()

      // If no current group selected, select the first one (personal group)
      if (!currentGroupId.value && fetchedGroups.length > 0) {
        currentGroupId.value = fetchedGroups[0]._id || null
      }

      // If current group no longer exists, switch to first available
      if (currentGroupId.value && !groups.value.find(g => g._id === currentGroupId.value)) {
        currentGroupId.value = fetchedGroups[0]?._id || null
      }
    } catch (error: any) {
      console.error('Failed to fetch groups:', error)
      const is404 = error instanceof ApiError && error.status === 404
      if (!is404) {
        Notify.create({
          type: 'warning',
          message: 'Failed to load groups',
          timeout: 2000
        })
      }
    } finally {
      loading.value = false
    }
  }

  async function createGroup(name: string) {
    loading.value = true
    try {
      const newGroup = await GroupsService.postApiGroups({ name })
      groups.value.push(newGroup)

      Notify.create({
        type: 'positive',
        message: 'Group created successfully',
        timeout: 2000
      })

      return newGroup
    } catch (error: any) {
      console.error('Failed to create group:', error)
      const message = error instanceof ApiError ? error.body?.message : 'Failed to create group'
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }

  async function selectGroup(groupId: string) {

    const group = groups.value.find(g => g._id === groupId)
    if (!group) {
      console.error('Group not found for ID:', groupId)
      return
    }

    try {

      // Call the API to set active group on the server FIRST
      await AuthenticationService.postApiAuthActiveGroup({ groupId })

      // Update local state after successful API call
      currentGroupId.value = groupId

      Notify.create({
        type: 'info',
        message: `Switched to ${group.name}`,
        timeout: 1500
      })
    } catch (error: any) {
      console.error('Failed to set active group:', error)
      const message = error instanceof ApiError ? error.body?.message : 'Failed to switch group'
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })
    }
  }

  async function initialize() {
    await fetchGroups()
  }

  return {
    groups,
    sortedGroups,
    currentGroup,
    currentGroupId,
    loading,
    lastSynced,
    fetchGroups,
    createGroup,
    selectGroup,
    initialize
  }
}, {
  persist: {
    paths: ['currentGroupId'] // Only persist the selected group
  }
})
