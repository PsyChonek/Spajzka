import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  MealPlanService,
  type MealPlanEntry,
  type CreateMealPlanEntryRequest,
  type UpdateMealPlanEntryRequest,
  type ShoppingPreviewRequest,
  type ShoppingPreviewResponse,
  type GenerateShoppingRequest,
  type GenerateShoppingResponse,
  ApiError
} from '@shared/api-client'
import { isOnline } from '@/utils/network'
import { classifyFetchError, logFetchError, fetchErrorToast } from '@/utils/fetchError'
import { toISODate } from '@/utils/date'
import { Notify } from 'quasar'
import { useGroupsStore } from './groupsStore'

export const DEFAULT_RANGE_PAST_DAYS = 14
export const DEFAULT_RANGE_FUTURE_DAYS = 60
const DAY_MS = 86_400_000

export const useMealPlanStore = defineStore('mealPlan', () => {
  const entries = ref<MealPlanEntry[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())
  /** ISO date (YYYY-MM-DD) of the start of the currently-loaded window. */
  const rangeStart = ref<string | null>(null)
  /** ISO date (YYYY-MM-DD) of the end of the currently-loaded window. */
  const rangeEnd = ref<string | null>(null)
  /**
   * Deduplicates concurrent fetches for the same range. Keyed `${from}|${to}`.
   * Router guard's `refreshAllStores()` and `MealPlanView.onMounted` both call
   * `fetchItems()` on a page refresh; without this guard, both issue identical
   * GETs and both can surface a toast on transient failures.
   */
  const inflight = ref<Map<string, Promise<void>>>(new Map())

  // Watch for group changes and refetch entries
  const groupsStore = useGroupsStore()
  watch(() => groupsStore.currentGroupId, (newGroupId, oldGroupId) => {
    if (newGroupId && newGroupId !== oldGroupId) {
      fetchItems()
    }
  }, { immediate: false })

  // Computed
  const sortedEntries = computed(() => {
    return [...entries.value].sort((a, b) =>
      new Date(a.cookDate || '').getTime() - new Date(b.cookDate || '').getTime()
    )
  })

  /** Groups entries by their cookDate for calendar rendering. */
  const entriesByDate = computed<Record<string, MealPlanEntry[]>>(() => {
    const map: Record<string, MealPlanEntry[]> = {}
    for (const entry of entries.value) {
      const date = entry.cookDate
      if (!date) continue
      const key = date.slice(0, 10) // normalise to YYYY-MM-DD
      if (!map[key]) map[key] = []
      map[key].push(entry)
    }
    return map
  })

  /**
   * Groups entries by every date in eatDates (falls back to cookDate when
   * eatDates is empty/missing). Used to show leftovers on a calendar.
   */
  const entriesExpandedByEatDate = computed<Record<string, MealPlanEntry[]>>(() => {
    const map: Record<string, MealPlanEntry[]> = {}
    for (const entry of entries.value) {
      const dates =
        entry.eatDates && entry.eatDates.length > 0
          ? entry.eatDates
          : entry.cookDate
          ? [entry.cookDate]
          : []
      for (const date of dates) {
        const key = date.slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(entry)
      }
    }
    return map
  })

  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  // Actions

  /**
   * Compatibility entry-point for useStoreRefresh / useOnlineSync.
   * Fetches a default window of today-14d … today+60d unless a window is
   * already loaded, in which case it reuses the existing range.
   */
  async function fetchItems() {
    const today = new Date()
    const from = rangeStart.value ?? toISODate(new Date(today.getTime() - DEFAULT_RANGE_PAST_DAYS * DAY_MS))
    const to = rangeEnd.value ?? toISODate(new Date(today.getTime() + DEFAULT_RANGE_FUTURE_DAYS * DAY_MS))
    await fetchRange(from, to)
  }

  /** Fetches entries for an explicit date window and replaces local state. */
  async function fetchRange(from: string, to: string) {
    if (!isOnline()) {
      return
    }
    if (from === rangeStart.value && to === rangeEnd.value && entries.value.length > 0) {
      return
    }

    const key = `${from}|${to}`
    const existing = inflight.value.get(key)
    if (existing) return existing

    loading.value = true
    const task = (async () => {
      try {
        const fetched = await MealPlanService.getApiMealPlan(from, to)
        entries.value = fetched
        rangeStart.value = from
        rangeEnd.value = to
        lastSynced.value = new Date()
        pendingChanges.value.clear()
      } catch (error) {
        const classified = classifyFetchError(error)
        logFetchError('mealPlan', `fetchRange(${from}..${to})`, classified)
        const toast = fetchErrorToast(classified)
        if (toast) {
          Notify.create({ type: 'warning', message: toast, timeout: 2500 })
        }
      } finally {
        loading.value = false
        inflight.value.delete(key)
      }
    })()
    inflight.value.set(key, task)
    return task
  }

  /** Optimistically creates a meal-plan entry and syncs when online. */
  async function addEntry(data: CreateMealPlanEntryRequest) {
    const tempId = `temp_${Date.now()}`

    const tempEntry: MealPlanEntry = {
      _id: tempId,
      recipeId: data.recipeId,
      recipeType: data.recipeType as MealPlanEntry.recipeType,
      cookDate: data.cookDate,
      servings: data.servings,
      eatDates: data.eatDates ?? [data.cookDate],
      mealTypes: data.mealTypes,
      notes: data.notes,
      groupId: data.groupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    entries.value.push(tempEntry)

    if (isOnline()) {
      try {
        const saved = await MealPlanService.postApiMealPlan(data)
        const index = entries.value.findIndex((e) => e._id === tempId)
        if (index !== -1) {
          entries.value[index] = saved
        }
        lastSynced.value = new Date()
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (!is404) {
          console.error('Failed to create meal-plan entry on server:', error)
          pendingChanges.value.set(tempId, 'create')
          Notify.create({
            type: 'warning',
            message: 'Entry saved locally. Will sync when online.',
            timeout: 2000
          })
        }
      }
    } else {
      pendingChanges.value.set(tempId, 'create')
      Notify.create({
        type: 'info',
        message: 'Entry saved locally. Will sync when online.',
        timeout: 2000
      })
    }
  }

  /** Partially updates a meal-plan entry, applying changes locally first. */
  async function updateEntry(id: string, updates: UpdateMealPlanEntryRequest) {
    const entry = entries.value.find((e) => e._id === id)
    if (entry) {
      Object.assign(entry, updates, { updatedAt: new Date().toISOString() })

      if (isOnline() && !id.startsWith('temp_')) {
        try {
          const updated = await MealPlanService.patchApiMealPlan(id, updates)
          Object.assign(entry, updated)
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (!is404) {
            console.error('Failed to update meal-plan entry on server:', error)
            pendingChanges.value.set(id, 'update')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        pendingChanges.value.set(id, 'update')
      }
    }
  }

  /**
   * Deletes a meal-plan entry, optionally removing linked shopping items.
   * When removeShoppingItems is true the shoppingStore is invalidated on success.
   */
  async function deleteEntry(id: string, removeShoppingItems = false) {
    const index = entries.value.findIndex((e) => e._id === id)
    if (index !== -1) {
      entries.value.splice(index, 1)

      if (isOnline() && !id.startsWith('temp_')) {
        try {
          await MealPlanService.deleteApiMealPlan(id, { removeShoppingItems })
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()

          // Invalidate shopping list when linked items were removed
          if (removeShoppingItems) {
            const { useShoppingStore } = await import('./shoppingStore')
            await useShoppingStore().fetchItems()
          }
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (!is404) {
            console.error('Failed to delete meal-plan entry on server:', error)
            pendingChanges.value.set(id, 'delete')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        pendingChanges.value.set(id, 'delete')
      }
    }
  }

  /**
   * Dry-run that aggregates ingredients for a date range without mutating data.
   * Returns null when offline (with a user-facing notification).
   */
  async function previewShopping(params: ShoppingPreviewRequest): Promise<ShoppingPreviewResponse | null> {
    if (!isOnline()) {
      Notify.create({
        type: 'warning',
        message: 'Shopping preview requires an online connection',
        timeout: 2500
      })
      return null
    }

    try {
      return await MealPlanService.postApiMealPlanShoppingPreview(params)
    } catch (error: any) {
      console.error('Failed to preview shopping:', error)
      return null
    }
  }

  /**
   * Aggregates ingredients for a date range and inserts them into shopping.
   * Returns null when offline (with a user-facing notification).
   * On success the shoppingStore is refreshed so new items appear immediately.
   */
  async function generateShopping(params: GenerateShoppingRequest): Promise<GenerateShoppingResponse | null> {
    if (!isOnline()) {
      Notify.create({
        type: 'warning',
        message: 'Generating shopping requires an online connection',
        timeout: 2500
      })
      return null
    }

    try {
      const result = await MealPlanService.postApiMealPlanGenerateShopping(params)

      Notify.create({
        type: 'positive',
        message: `Added ${result.addedCount ?? 0} shopping item(s) from meal plan`,
        timeout: 2500
      })

      // Pull new shopping items into the shopping store
      const { useShoppingStore } = await import('./shoppingStore')
      await useShoppingStore().fetchItems()

      return result
    } catch (error: any) {
      console.error('Failed to generate shopping from meal plan:', error)
      return null
    }
  }

  /** Replays all queued create/update/delete operations against the server. */
  async function syncPendingChanges() {
    if (!isOnline() || pendingChanges.value.size === 0) {
      return
    }

    const changes = Array.from(pendingChanges.value.entries())

    for (const [id, action] of changes) {
      try {
        const entry = entries.value.find((e) => e._id === id)

        if (action === 'create' && entry) {
          // Strip local-only fields before sending to server
          const { _id, createdAt, updatedAt, ...createData } = entry as any
          const saved = await MealPlanService.postApiMealPlan(createData as CreateMealPlanEntryRequest)
          const index = entries.value.findIndex((e) => e._id === id)
          if (index !== -1) {
            entries.value[index] = saved
          }
        } else if (action === 'update' && entry && !id.startsWith('temp_')) {
          const { _id, createdAt, updatedAt, createdBy, groupId, recipeId, recipeType, recipeName, shoppingGeneratedAt, shoppingBatchId, ...updateData } = entry as any
          await MealPlanService.patchApiMealPlan(id, updateData as UpdateMealPlanEntryRequest)
        } else if (action === 'delete' && !id.startsWith('temp_')) {
          await MealPlanService.deleteApiMealPlan(id)
        }

        pendingChanges.value.delete(id)
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (is404) {
          // API not yet set up — silently discard the pending change
          pendingChanges.value.delete(id)
        } else {
          console.error(`Failed to sync ${action} for meal-plan entry ${id}:`, error)
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
    entries.value = []
    loading.value = false
    lastSynced.value = null
    pendingChanges.value.clear()
    rangeStart.value = null
    rangeEnd.value = null
  }

  return {
    // State
    entries,
    loading,
    lastSynced,
    pendingChanges,
    rangeStart,
    rangeEnd,
    // Computed
    sortedEntries,
    entriesByDate,
    entriesExpandedByEatDate,
    hasPendingChanges,
    // Actions
    fetchItems,
    fetchRange,
    addEntry,
    updateEntry,
    deleteEntry,
    previewShopping,
    generateShopping,
    syncPendingChanges,
    $reset
  }
}, {
  // Persist only the pieces that matter across reloads.
  // `entries` is excluded — it's re-fetched on mount via fetchRange, and persisting
  // the full array on every calendar navigation is expensive on mobile.
  persist: {
    pick: ['pendingChanges', 'rangeStart', 'rangeEnd', 'lastSynced']
  }
})
