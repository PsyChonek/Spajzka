<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { useAuthStore } from '@/stores/authStore'
import PageWrapper from '@/components/PageWrapper.vue'
import SearchInput from '@/components/SearchInput.vue'
import RecipeDialog, { type RecipeFormData } from '@/components/RecipeDialog.vue'
import { GlobalRecipe } from '@/api-client'

const $q = useQuasar()
const recipesStore = useRecipesStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showRecipeDialog = ref(false)
const editingRecipe = ref<Recipe | null>(null)

// Computed
const displayedRecipes = computed(() => {
  const allRecipes = recipesStore.sortedItems

  if (!searchQuery.value) return allRecipes

  const query = searchQuery.value.toLowerCase()
  return allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(query) ||
    (recipe.description && recipe.description.toLowerCase().includes(query))
  )
})

const canCreateGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:create')
})

const canEditGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:update')
})

const canDeleteGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:delete')
})

const allColumns = [
  {
    name: 'icon',
    label: '',
    align: 'center' as const,
    field: (row: Recipe) => row.icon || '🍽️',
    sortable: false,
    classes: 'col-icon',
    headerClasses: 'col-icon'
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: Recipe) => row.name,
    sortable: true,
    classes: 'col-name',
    headerClasses: 'col-name'
  },
  {
    name: 'type',
    label: 'Type',
    align: 'left' as const,
    field: (row: Recipe) => row.recipeType,
    sortable: true,
    classes: 'col-type',
    headerClasses: 'col-type'
  },
  {
    name: 'servings',
    label: 'Servings',
    align: 'center' as const,
    field: (row: Recipe) => row.servings,
    sortable: true,
    classes: 'col-servings',
    headerClasses: 'col-servings'
  },
  {
    name: 'ingredients',
    label: 'Ingredients',
    align: 'center' as const,
    field: (row: Recipe) => row.ingredients?.length || 0,
    sortable: true,
    hideOnMobile: true,
    classes: 'col-ingredients',
    headerClasses: 'col-ingredients'
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false,
    hideOnMobile: true,
    classes: 'col-actions',
    headerClasses: 'col-actions'
  }
]

const columns = computed(() => {
  if ($q.screen.lt.md) {
    return allColumns.filter(col => !col.hideOnMobile)
  }
  return allColumns
})

// Dialog actions
const openAddDialog = () => {
  editingRecipe.value = null
  showRecipeDialog.value = true
}

const openEditDialog = (recipe: Recipe) => {
  editingRecipe.value = recipe
  showRecipeDialog.value = true
}

const handleSaveRecipe = async (recipeData: RecipeFormData) => {
  if (editingRecipe.value) {
    // Update existing recipe
    if (!editingRecipe.value._id) return
    await recipesStore.updateRecipe(editingRecipe.value._id, recipeData)
  } else {
    // Create new recipe
    if (recipeData.recipeType === GlobalRecipe.recipeType.GLOBAL) {
      if (!canCreateGlobalRecipe.value) {
        $q.notify({
          type: 'negative',
          message: 'You do not have permission to create global recipes'
        })
        return
      }
      await recipesStore.addGlobalRecipe(recipeData)
    } else {
      await recipesStore.addGroupRecipe(recipeData)
    }
  }

  // Clear search after adding
  searchQuery.value = ''
  editingRecipe.value = null
}

const deleteRecipe = (recipeId: string) => {
  recipesStore.deleteRecipe(recipeId)
}

const canEditRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canEditGlobalRecipe.value
  return true // Group recipes can always be edited
}

const canDeleteRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canDeleteGlobalRecipe.value
  return true // Group recipes can always be deleted
}

</script>

<template>
  <PageWrapper>
    <div class="recipes-view">
    <div class="search-container">
        <SearchInput v-model="searchQuery" placeholder="Search recipes..." @add="openAddDialog" />
      </div>

    <div class="table-container q-mt-lg">
        <q-table
          :rows="displayedRecipes"
          :columns="columns"
          row-key="_id"
          :rows-per-page-options="[10, 25, 50]"
          dense
          flat
          bordered
        >
          <template v-slot:body-cell-icon="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row)">
              <div class="item-icon">{{ props.row.icon || '🍽️' }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-name="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row)">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div v-if="props.row.description" class="text-caption text-grey-7">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-badge
                v-if="props.row.recipeType === GlobalRecipe.recipeType.GLOBAL"
                color="primary"
                label="Global"
              >
                <q-tooltip>
                  This recipe is visible to all users
                </q-tooltip>
              </q-badge>
              <q-badge
                v-else
                color="secondary"
                outline
                label="Group"
              >
                <q-tooltip>
                  This recipe is shared with your group
                </q-tooltip>
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons">
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="openEditDialog(props.row)"
                  :disable="!canEditRecipe(props.row)"
                >
                  <q-tooltip>Edit Recipe</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="deleteRecipe(props.row._id)"
                  :disable="!canDeleteRecipe(props.row)"
                >
                  <q-tooltip>Delete recipe</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center q-gutter-sm q-py-lg">
              <q-icon size="2em" name="restaurant_menu" />
              <span class="text-h6">No recipes yet</span>
            </div>
          </template>
        </q-table>
      </div>

      <!-- Recipe Dialog -->
      <RecipeDialog
        v-model="showRecipeDialog"
        :editing-recipe="editingRecipe"
        :initial-name="searchQuery"
        :read-only="editingRecipe ? !canEditRecipe(editingRecipe) : false"
        @save="handleSaveRecipe"
      />
    </div>
  </PageWrapper>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.table-container {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.item-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Table layout */
:deep(.q-table thead),
:deep(.q-table tbody),
:deep(.q-table tr) {
  width: 100%;
  display: table;
  table-layout: fixed;
}

:deep(.q-table th),
:deep(.q-table td) {
  padding: 8px;
  box-sizing: border-box;
}

/* Override Quasar's dense padding for first column */
:deep(.q-table--dense th:first-child),
:deep(.q-table--dense td:first-child) {
  padding-left: 8px;
}

/* Center icon column */
:deep(.q-table .col-icon) {
  width: 60px;
  text-align: center;
}

/* Desktop column widths */
:deep(.q-table .col-name) {
  width: auto;
}

:deep(.q-table .col-type) {
  width: 100px;
}

:deep(.q-table .col-servings) {
  width: 100px;
}

:deep(.q-table .col-ingredients) {
  width: 100px;
}

:deep(.q-table .col-actions) {
  width: 120px;
}

/* Ensure text wraps in name column (for description) */
:deep(.q-table .col-name) {
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

/* Mobile styles */
@media (max-width: 1023px) {
  /* Column widths for mobile */
  :deep(.q-table .col-icon) {
    width: 15%;
  }

  :deep(.q-table .col-name) {
    width: 45%;
  }

  :deep(.q-table .col-type) {
    width: 20%;
  }

  :deep(.q-table .col-servings) {
    width: 20%;
  }

  /* Fill viewport height */
  .recipes-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .table-container :deep(.q-table) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .table-container :deep(.q-table__container) {
    flex: 1;
    min-height: 0;
  }

  .table-container :deep(.q-table__middle) {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
