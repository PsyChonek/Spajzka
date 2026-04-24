import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { HistoryService, type HistoryEntry } from '@shared/api-client'
import { useGroupsStore } from './groupsStore'
import { isOnline } from '@/utils/network'
import { classifyFetchError, logFetchError, fetchErrorToast } from '@/utils/fetchError'
import { Notify } from 'quasar'

export type HistoryEntityFilter =
  | 'pantry' | 'shopping' | 'mealPlan' | 'recipe' | 'tag' | 'item' | 'group'

export type HistoryActionFilter =
  | 'create' | 'update' | 'delete' | 'join' | 'leave' | 'kick' | 'role_change'

const PAGE_SIZE = 50

/**
 * Read-only history log. Unlike the pantry/shopping stores this has no
 * offline queue and no persistence — it re-fetches on view mount and on
 * filter change.
 */
export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const nextCursor = ref<string | null>(null)
  const hasMore = ref(false)
  const lastSynced = ref<Date | null>(null)
  const filterEntityTypes = ref<HistoryEntityFilter[]>([])
  const filterAction = ref<HistoryActionFilter | null>(null)

  const groupsStore = useGroupsStore()

  // Refetch when group changes
  watch(() => groupsStore.currentGroupId, (newGroupId, oldGroupId) => {
    if (newGroupId && newGroupId !== oldGroupId) {
      fetchInitial()
    }
  })

  const sortedEntries = computed(() => entries.value)
  const isEmpty = computed(() => !loading.value && entries.value.length === 0)

  async function fetchInitial() {
    if (!isOnline()) return
    loading.value = true
    try {
      // Do NOT pass a client-side groupId — the server resolves it from
      // user.activeGroupId, same as pantry/shopping/meal-plan reads. Passing
      // groupsStore.currentGroupId here risks a mismatch when local state
      // hasn't caught up with the server's active group.
      const res = await HistoryService.getApiHistory(
        undefined,
        filterEntityTypes.value.length > 0 ? filterEntityTypes.value.join(',') : undefined,
        filterAction.value ?? undefined,
        PAGE_SIZE,
        undefined
      )
      entries.value = res.entries ?? []
      nextCursor.value = res.nextCursor ?? null
      hasMore.value = !!res.nextCursor
      lastSynced.value = new Date()
    } catch (error) {
      const classified = classifyFetchError(error)
      logFetchError('history', 'fetchInitial', classified)
      const toast = fetchErrorToast(classified)
      if (toast) {
        Notify.create({ type: 'warning', message: toast, timeout: 2500 })
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchMore() {
    if (!isOnline() || !nextCursor.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const res = await HistoryService.getApiHistory(
        undefined,
        filterEntityTypes.value.length > 0 ? filterEntityTypes.value.join(',') : undefined,
        filterAction.value ?? undefined,
        PAGE_SIZE,
        nextCursor.value
      )
      entries.value = [...entries.value, ...(res.entries ?? [])]
      nextCursor.value = res.nextCursor ?? null
      hasMore.value = !!res.nextCursor
    } catch (error) {
      const classified = classifyFetchError(error)
      logFetchError('history', 'fetchMore', classified)
    } finally {
      loadingMore.value = false
    }
  }

  function setEntityTypes(types: HistoryEntityFilter[]) {
    filterEntityTypes.value = types
    fetchInitial()
  }

  function setAction(action: HistoryActionFilter | null) {
    filterAction.value = action
    fetchInitial()
  }

  function $reset() {
    entries.value = []
    loading.value = false
    loadingMore.value = false
    nextCursor.value = null
    hasMore.value = false
    lastSynced.value = null
    filterEntityTypes.value = []
    filterAction.value = null
  }

  return {
    entries,
    sortedEntries,
    loading,
    loadingMore,
    hasMore,
    isEmpty,
    lastSynced,
    filterEntityTypes,
    filterAction,
    fetchInitial,
    fetchMore,
    setEntityTypes,
    setAction,
    $reset
  }
})
