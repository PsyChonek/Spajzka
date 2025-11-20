import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { RecipesService, GlobalRecipe, GroupRecipe, type CreateGlobalRecipeRequest, type CreateGroupRecipeRequest, ApiError } from '@/api-client'
import { isOnline } from '@/utils/network'
import { Notify } from 'quasar'
import { useGroupsStore } from './groupsStore'

// Union type for both recipe types
export type Recipe = GlobalRecipe | GroupRecipe

export const useRecipesStore = defineStore('recipes', () => {
  const items = ref<Recipe[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)
  const pendingChanges = ref<Map<string, 'create' | 'update' | 'delete'>>(new Map())

  // Watch for group changes and refetch group recipes
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

  const globalRecipes = computed(() =>
    sortedItems.value.filter(recipe => recipe.recipeType === GlobalRecipe.recipeType.GLOBAL)
  )

  const groupRecipes = computed(() =>
    sortedItems.value.filter(recipe => recipe.recipeType === GroupRecipe.recipeType.GROUP)
  )

  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  // Actions
  async function fetchItems() {
    if (!isOnline()) {
      return
    }

    loading.value = true
    try {
      const response = await RecipesService.getApiRecipes()

      // Combine global and group recipes
      const allRecipes: Recipe[] = [
        ...(response.globalRecipes || []),
        ...(response.groupRecipes || [])
      ]

      items.value = allRecipes
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
      }
    } finally {
      loading.value = false
    }
  }

  async function addGlobalRecipe(recipeData: CreateGlobalRecipeRequest) {
    const tempId = `temp_${Date.now()}`

    const tempRecipe: GlobalRecipe = {
      _id: tempId,
      ...recipeData,
      recipeType: GlobalRecipe.recipeType.GLOBAL,
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    items.value.push(tempRecipe)

    if (isOnline()) {
      try {
        const savedRecipe = await RecipesService.postApiRecipesGlobal(recipeData)
        const index = items.value.findIndex((r: Recipe) => r._id === tempId)
        if (index !== -1) {
          items.value[index] = savedRecipe
        }
        lastSynced.value = new Date()
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (!is404) {
          pendingChanges.value.set(tempId, 'create')
          Notify.create({
            type: 'warning',
            message: 'Recipe saved locally. Will sync when online.',
            timeout: 2000
          })
        }
      }
    } else {
      pendingChanges.value.set(tempId, 'create')
      Notify.create({
        type: 'info',
        message: 'Recipe saved locally. Will sync when online.',
        timeout: 2000
      })
    }
  }

  async function addGroupRecipe(recipeData: CreateGroupRecipeRequest) {
    const tempId = `temp_${Date.now()}`

    const tempRecipe: GroupRecipe = {
      _id: tempId,
      ...recipeData,
      recipeType: GroupRecipe.recipeType.GROUP,
      groupId: groupsStore.currentGroupId || 'temp-group',
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    items.value.push(tempRecipe)

    if (isOnline()) {
      try {
        const savedRecipe = await RecipesService.postApiRecipesGroup(recipeData)
        const index = items.value.findIndex((r: Recipe) => r._id === tempId)
        if (index !== -1) {
          items.value[index] = savedRecipe
        }
        lastSynced.value = new Date()
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (!is404) {
          pendingChanges.value.set(tempId, 'create')
          Notify.create({
            type: 'warning',
            message: 'Recipe saved locally. Will sync when online.',
            timeout: 2000
          })
        }
      }
    } else {
      pendingChanges.value.set(tempId, 'create')
      Notify.create({
        type: 'info',
        message: 'Recipe saved locally. Will sync when online.',
        timeout: 2000
      })
    }
  }

  async function updateRecipe(id: string, updates: Partial<Recipe>) {
    const recipe = items.value.find((r: Recipe) => r._id === id)
    if (recipe) {
      Object.assign(recipe, updates, { updatedAt: new Date().toISOString() })

      if (isOnline() && !id.startsWith('temp_')) {
        try {
          let updatedRecipe: any
          if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) {
            updatedRecipe = await RecipesService.putApiRecipesGlobal(id, updates as any)
            Object.assign(recipe, updatedRecipe)
          } else {
            updatedRecipe = await RecipesService.putApiRecipesGroup(id, updates as any)
            Object.assign(recipe, updatedRecipe)
          }
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (!is404) {
            pendingChanges.value.set(id, 'update')
          }
        }
      } else if (!isOnline() && !id.startsWith('temp_')) {
        pendingChanges.value.set(id, 'update')
      }
    }
  }

  async function deleteRecipe(id: string) {
    const index = items.value.findIndex((r: Recipe) => r._id === id)
    if (index !== -1) {
      const recipe = items.value[index]
      if (!recipe) return

      items.value.splice(index, 1)

      if (isOnline() && !id.startsWith('temp_')) {
        try {
          if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) {
            await RecipesService.deleteApiRecipesGlobal(id)
          } else {
            await RecipesService.deleteApiRecipesGroup(id)
          }
          pendingChanges.value.delete(id)
          lastSynced.value = new Date()
        } catch (error: any) {
          const is404 = error instanceof ApiError && error.status === 404
          if (!is404) {
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
        const recipe = items.value.find((r: Recipe) => r._id === id)

        if (action === 'create' && recipe) {
          const { _id, userId, createdAt, updatedAt, ...recipeData } = recipe as any

          if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) {
            const savedRecipe = await RecipesService.postApiRecipesGlobal(recipeData)
            const index = items.value.findIndex((r: Recipe) => r._id === id)
            if (index !== -1) {
              items.value[index] = savedRecipe
            }
          } else {
            const savedRecipe = await RecipesService.postApiRecipesGroup(recipeData)
            const index = items.value.findIndex((r: Recipe) => r._id === id)
            if (index !== -1) {
              items.value[index] = savedRecipe
            }
          }
        } else if (action === 'update' && recipe && !id.startsWith('temp_')) {
          const { _id, recipeType, ...updates } = recipe as any
          if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) {
            await RecipesService.putApiRecipesGlobal(id, updates)
          } else {
            await RecipesService.putApiRecipesGroup(id, updates)
          }
        } else if (action === 'delete' && recipe && !id.startsWith('temp_')) {
          if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) {
            await RecipesService.deleteApiRecipesGlobal(id)
          } else {
            await RecipesService.deleteApiRecipesGroup(id)
          }
        }

        pendingChanges.value.delete(id)
      } catch (error: any) {
        const is404 = error instanceof ApiError && error.status === 404
        if (is404) {
          pendingChanges.value.delete(id)
        } else {
          console.error(`Failed to sync ${action} for recipe ${id}:`, error)
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
    globalRecipes,
    groupRecipes,
    loading,
    lastSynced,
    hasPendingChanges,
    fetchItems,
    addGlobalRecipe,
    addGroupRecipe,
    updateRecipe,
    deleteRecipe,
    syncPendingChanges,
    $reset
  }
}, {
  persist: true
})
