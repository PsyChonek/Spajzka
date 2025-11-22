<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { useAuthStore } from '@/stores/authStore'
import { useItemsStore } from '@/stores/itemsStore'
import PageWrapper from '@/components/PageWrapper.vue'
import SearchInput from '@/components/SearchInput.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import { GlobalRecipe, GroupRecipe, type RecipeIngredient } from '@/api-client'

const $q = useQuasar()
const recipesStore = useRecipesStore()
const authStore = useAuthStore()
const itemsStore = useItemsStore()

const searchQuery = ref('')
const showRecipeDialog = ref(false)
const editingRecipe = ref<Recipe | null>(null)
const showAddItemDialog = ref(false)
const addItemDialogInitialData = ref<Partial<ItemFormData>>({})
const currentIngredientIndex = ref<number | null>(null)

// Form fields
const formName = ref('')
const formDescription = ref('')
const formIcon = ref('')
const formServings = ref(4)
const formRecipeType = ref<GlobalRecipe.recipeType | GroupRecipe.recipeType>(GlobalRecipe.recipeType.GLOBAL)
const formIngredients = ref<RecipeIngredient[]>([{ itemName: '', quantity: 1, unit: 'pcs' }])
const formInstructions = ref<string[]>([''])

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

const showAddButton = computed(() => {
  if (!searchQuery.value) return false

  // Show button if no recipes match, or if no exact match exists
  const query = searchQuery.value.toLowerCase().trim()
  const hasExactMatch = displayedRecipes.value.some(recipe =>
    (recipe.name || '').toLowerCase().trim() === query
  )

  return !hasExactMatch
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
  formRecipeType.value = GroupRecipe.recipeType.GROUP // Default to group
  formName.value = searchQuery.value
  formDescription.value = ''
  formIcon.value = ''
  formServings.value = 4
  formIngredients.value = [{ itemName: '', quantity: 1, unit: 'pcs' }]
  formInstructions.value = ['']
  showRecipeDialog.value = true
}

const openEditDialog = (recipe: Recipe) => {
  editingRecipe.value = recipe
  formRecipeType.value = recipe.recipeType
  formName.value = recipe.name
  formDescription.value = recipe.description || ''
  formIcon.value = recipe.icon || ''
  formServings.value = recipe.servings
  formIngredients.value = recipe.ingredients?.length > 0
    ? [...recipe.ingredients]
    : [{ itemName: '', quantity: 1, unit: 'pcs' }]
  formInstructions.value = recipe.instructions?.length > 0
    ? [...recipe.instructions]
    : ['']
  showRecipeDialog.value = true
}

const handleCloseDialog = () => {
  showRecipeDialog.value = false
  editingRecipe.value = null
}

const handleSaveRecipe = async () => {
  const recipeData = {
    name: formName.value.trim(),
    description: formDescription.value.trim() || undefined,
    icon: formIcon.value.trim() || undefined,
    servings: formServings.value,
    ingredients: formIngredients.value.filter(ing => ing.itemName.trim()),
    instructions: formInstructions.value.filter(inst => inst.trim())
  }

  if (editingRecipe.value) {
    // Update existing recipe
    if (!editingRecipe.value._id) return
    await recipesStore.updateRecipe(editingRecipe.value._id, recipeData)
  } else {
    // Create new recipe
    if (formRecipeType.value === GlobalRecipe.recipeType.GLOBAL) {
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

  handleCloseDialog()
}

const deleteRecipe = (recipeId: string) => {
  recipesStore.deleteRecipe(recipeId)
}

const isFormValid = () => {
  if (!formName.value.trim()) return false
  if (formServings.value < 1) return false
  const hasIngredients = formIngredients.value.some(ing => ing.itemName.trim())
  const hasInstructions = formInstructions.value.some(inst => inst.trim())
  return hasIngredients && hasInstructions
}

// Ingredient management
const addIngredient = () => {
  formIngredients.value.push({ itemName: '', quantity: 1, unit: 'pcs' })
}

const removeIngredient = (index: number) => {
  if (formIngredients.value.length > 1) {
    formIngredients.value.splice(index, 1)
  }
}

// Item autocomplete for ingredients

const getItemOptions = (index: number, val: string, update: any) => {
  // Track the current search value
  currentIngredientSearchValue.value[index] = val

  if (val === '') {
    update(() => {
      // Show top items when no search
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    const filtered = itemsStore.sortedItems
      .filter(item => item.name.toLowerCase().includes(needle))
      .slice(0, 20)

    // Store the options for this index
    if (!ingredientOptions.value[index]) {
      ingredientOptions.value[index] = []
    }
    ingredientOptions.value[index] = filtered
  })
}

const ingredientOptions = ref<any[][]>([])
const currentIngredientSearchValue = ref<string[]>([]) // Track search value for each ingredient
const ingredientSelectRefs = ref<any[]>([]) // Track q-select refs for each ingredient

const handleItemSelect = (index: number, val: any) => {
  const ingredient = formIngredients.value[index]
  if (!ingredient) return

  // If val is an object from items (selected from dropdown)
  if (val && val._id) {
    ingredient.itemId = val._id
    ingredient.itemName = val.name
    ingredient.unit = val.defaultUnit || ingredient.unit || 'pcs'
  } else if (typeof val === 'string') {
    // Custom text input
    ingredient.itemName = val
    ingredient.itemId = undefined
  }
}

// Instruction management
const addInstruction = () => {
  formInstructions.value.push('')
}

const removeInstruction = (index: number) => {
  if (formInstructions.value.length > 1) {
    formInstructions.value.splice(index, 1)
  }
}

const canEditRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canEditGlobalRecipe.value
  return true // Group recipes can always be edited
}

const canDeleteRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canDeleteGlobalRecipe.value
  return true // Group recipes can always be deleted
}

const canCreateGlobalItem = computed(() => {
  return authStore.hasGlobalPermission('global_items:create')
})

// Handle adding new item from ingredient search
const openAddItemDialog = (searchValue: string, ingredientIndex?: number) => {
  addItemDialogInitialData.value = {
    name: searchValue,
    defaultUnit: 'pcs',
    category: '',
    icon: ''
  }
  currentIngredientIndex.value = ingredientIndex !== undefined ? ingredientIndex : null
  showAddItemDialog.value = true
}

const handleSaveNewItem = async (data: ItemFormData) => {
  // Create the item as a global or group item
  if (data.isGlobal && canCreateGlobalItem.value) {
    await itemsStore.addGlobalItem({
      name: data.name,
      category: data.category || 'Other',
      icon: data.icon || '📦',
      defaultUnit: data.defaultUnit || 'pcs',
      searchNames: data.searchNames || []
    })
  } else {
    await itemsStore.addGroupItem({
      name: data.name,
      category: data.category || 'Other',
      icon: data.icon || '📦',
      defaultUnit: data.defaultUnit || 'pcs',
      searchNames: data.searchNames || []
    })
  }

  // After creating the item, find it and add it to the current ingredient being edited
  const newItem = itemsStore.sortedItems.find(item => item.name === data.name)
  if (newItem && currentIngredientIndex.value !== null) {
    const ingredient = formIngredients.value[currentIngredientIndex.value]
    if (ingredient) {
      ingredient.itemId = newItem._id
      ingredient.itemName = newItem.name
      ingredient.unit = newItem.defaultUnit || ingredient.unit || 'pcs'
    }

    // Close the dropdown for this ingredient
    const selectRef = ingredientSelectRefs.value[currentIngredientIndex.value]
    if (selectRef) {
      selectRef.hidePopup()
    }
  }

  // Close the dialog
  showAddItemDialog.value = false

  $q.notify({
    type: 'positive',
    message: `Item "${data.name}" created successfully`
  })
}
</script>

<template>
  <PageWrapper>
    <div class="recipes-view">
    <div class="search-container">
        <SearchInput v-model="searchQuery" placeholder="Search recipes..." />

        <div v-if="showAddButton" class="add-button-container q-mt-md">
          <q-btn
            color="primary"
            icon="add"
            @click="openAddDialog"
          >
            <span class="q-ml-xs">Create "{{ searchQuery }}" as a new recipe</span>
          </q-btn>
        </div>
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

      <!-- Add Item Dialog -->
      <AddItemDialog
        v-model="showAddItemDialog"
        title="Add New Item"
        :initial-data="addItemDialogInitialData"
        :show-pantry-fields="false"
        :show-global-toggle="canCreateGlobalItem"
        @save="handleSaveNewItem"
      />

      <!-- Recipe Dialog -->
      <q-dialog v-model="showRecipeDialog" persistent>
        <q-card style="width: 100%; max-width: 600px; max-height: 80vh">
          <q-card-section>
            <div class="text-h6">{{ editingRecipe ? 'Edit Recipe' : 'Add New Recipe' }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none" style="max-height: 60vh; overflow-y: auto">
            <!-- Basic Information -->
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Basic Information</div>

            <q-input
              v-model="formName"
              outlined
              label="Recipe Name *"
              class="q-mb-md"
            />

            <q-input
              v-model="formDescription"
              outlined
              label="Description"
              type="textarea"
              rows="2"
              class="q-mb-md"
            />

            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-6">
                <q-input
                  v-model="formIcon"
                  outlined
                  label="Icon (emoji)"
                  placeholder="🍽️"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="formServings"
                  outlined
                  label="Servings *"
                  type="number"
                  min="1"
                />
              </div>
            </div>

            <!-- Recipe Type Toggle (only shown when adding new recipe) -->
            <template v-if="!editingRecipe && canCreateGlobalRecipe">
              <q-toggle
                v-model="formRecipeType"
                true-value="global"
                false-value="group"
                label="Add as Global Recipe"
                color="primary"
                class="q-mb-md"
              >
                <q-tooltip>
                  Global recipes are visible to all users and can only be managed by system moderators
                </q-tooltip>
              </q-toggle>
            </template>

            <q-separator class="q-my-md" />

            <!-- Ingredients -->
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              Ingredients
              <q-btn
                flat
                dense
                round
                icon="add"
                size="sm"
                color="primary"
                @click="addIngredient"
                class="q-ml-sm"
              />
            </div>

            <div
              v-for="(ingredient, index) in formIngredients"
              :key="index"
              class="row q-col-gutter-sm q-mb-sm"
            >
              <div class="col-5">
                <q-select
                  :ref="el => { if (el) ingredientSelectRefs[index] = el }"
                  v-model="ingredient.itemName"
                  outlined
                  dense
                  use-input
                  input-debounce="300"
                  label="Ingredient *"
                  placeholder="Start typing to search items..."
                  :options="ingredientOptions[index] || []"
                  option-label="name"
                  @filter="(val, update) => getItemOptions(index, val, update)"
                  @update:model-value="(val) => handleItemSelect(index, val)"
                  new-value-mode="add-unique"
                  fill-input
                  hide-selected
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" clickable>
                      <q-item-section avatar>
                        <span class="text-h6">{{ scope.opt.icon || '📦' }}</span>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.name }}</q-item-label>
                        <q-item-label caption v-if="scope.opt.category">
                          {{ scope.opt.category }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="scope.opt.defaultUnit">
                        <q-item-label caption class="text-weight-medium">{{ scope.opt.defaultUnit }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:after-options>
                    <template v-if="currentIngredientSearchValue[index]">
                      <q-separator />
                      <q-item clickable @click="openAddItemDialog(currentIngredientSearchValue[index] || '', index)">
                        <q-item-section avatar>
                          <q-icon name="add" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Add new item</q-item-label>
                          <q-item-label caption>Create "{{ currentIngredientSearchValue[index] }}" as a new item</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </template>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No items found
                      </q-item-section>
                    </q-item>
                    <template v-if="currentIngredientSearchValue[index]">
                      <q-separator />
                      <q-item clickable @click="openAddItemDialog(currentIngredientSearchValue[index] || '', index)">
                        <q-item-section avatar>
                          <q-icon name="add" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Add new item</q-item-label>
                          <q-item-label caption>Create "{{ currentIngredientSearchValue[index] }}" as a new item</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </template>
                </q-select>
              </div>
              <div class="col-3">
                <q-input
                  v-model.number="ingredient.quantity"
                  outlined
                  dense
                  label="Quantity"
                  type="number"
                  min="0"
                  step="0.1"
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model="ingredient.unit"
                  outlined
                  dense
                  label="Unit"
                  placeholder="kg, pcs"
                />
              </div>
              <div class="col-1 flex items-center">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  size="sm"
                  color="negative"
                  @click="removeIngredient(index)"
                  :disable="formIngredients.length === 1"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Instructions -->
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              Instructions
              <q-btn
                flat
                dense
                round
                icon="add"
                size="sm"
                color="primary"
                @click="addInstruction"
                class="q-ml-sm"
              />
            </div>

            <div
              v-for="(_instruction, index) in formInstructions"
              :key="index"
              class="row q-col-gutter-sm q-mb-sm"
            >
              <div class="col-1 flex items-center justify-center">
                <span class="text-weight-bold">{{ index + 1 }}.</span>
              </div>
              <div class="col-10">
                <q-input
                  v-model="formInstructions[index]"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :label="`Step ${index + 1}`"
                  placeholder="Describe this step..."
                />
              </div>
              <div class="col-1 flex items-center">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  size="sm"
                  color="negative"
                  @click="removeInstruction(index)"
                  :disable="formInstructions.length === 1"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" @click="handleCloseDialog" />
            <q-btn
              label="Save"
              color="primary"
              @click="handleSaveRecipe"
              :disable="!isFormValid()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </PageWrapper>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-button-container {
  display: flex;
  justify-content: center;
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
