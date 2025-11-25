<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useBackButton } from '@/composables/useBackButton'
import type { Recipe } from '@/stores/recipesStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useAuthStore } from '@/stores/authStore'
import { GlobalRecipe, GroupRecipe, type RecipeIngredient } from '@/api-client'
import AddItemDialog, { type ItemFormData } from './AddItemDialog.vue'
import TagSelector from './TagSelector.vue'

interface Props {
  modelValue: boolean
  editingRecipe?: Recipe | null
  initialName?: string
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editingRecipe: null,
  initialName: '',
  readOnly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: RecipeFormData]
  cancel: []
}>()

export interface RecipeFormData {
  name: string
  description?: string
  icon?: string
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string[]
  tags?: string[]
  recipeType?: GlobalRecipe.recipeType | GroupRecipe.recipeType
}

const $q = useQuasar()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

// Form fields
const formName = ref('')
const formDescription = ref('')
const formIcon = ref('')
const formServings = ref(4)
const formRecipeType = ref<GlobalRecipe.recipeType | GroupRecipe.recipeType>(GlobalRecipe.recipeType.GLOBAL)
const formIngredients = ref<RecipeIngredient[]>([{ itemName: '', quantity: 1, unit: 'pcs' }])
const formInstructions = ref<string[]>([''])
const formTags = ref<string[]>([])

// Item dialog state
const showAddItemDialog = ref(false)
const addItemDialogInitialData = ref<Partial<ItemFormData>>({})
const currentIngredientIndex = ref<number | null>(null)

// Item autocomplete
const ingredientOptions = ref<any[][]>([])
const currentIngredientSearchValue = ref<string[]>([])
const ingredientSelectRefs = ref<any[]>([])

const canCreateGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:create')
})

const canCreateGlobalItem = computed(() => {
  return authStore.hasGlobalPermission('global_items:create')
})

// Back button handler
const handleCloseDialog = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const { pushHistoryState, removeHistoryState } = useBackButton(
  () => props.modelValue,
  handleCloseDialog
)

// Define resetForm first
const resetForm = () => {
  formRecipeType.value = GroupRecipe.recipeType.GROUP
  formName.value = props.initialName || ''
  formDescription.value = ''
  formIcon.value = ''
  formServings.value = 4
  formIngredients.value = [{ itemName: '', quantity: 1, unit: 'pcs' }]
  formInstructions.value = ['']
  formTags.value = []
}

// Watch for editing recipe changes
watch(() => props.editingRecipe, (recipe) => {
  if (recipe) {
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
    formTags.value = recipe.tags || []
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for dialog opening/closing to manage back button behavior
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    pushHistoryState()
  } else {
    removeHistoryState()
  }
})

const handleSaveRecipe = () => {
  const recipeData: RecipeFormData = {
    name: formName.value.trim(),
    description: formDescription.value.trim() || undefined,
    icon: formIcon.value.trim() || undefined,
    servings: formServings.value,
    ingredients: formIngredients.value.filter(ing => ing.itemName.trim()),
    instructions: formInstructions.value.filter(inst => inst.trim()),
    tags: formTags.value
  }

  // Include recipe type only for new recipes
  if (!props.editingRecipe) {
    recipeData.recipeType = formRecipeType.value
  }

  emit('save', recipeData)
  emit('update:modelValue', false)
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

const getItemOptions = (index: number, val: string, update: any) => {
  currentIngredientSearchValue.value[index] = val

  if (val === '') {
    update(() => {
      // Show recently used items when no search
      if (!ingredientOptions.value[index]) {
        ingredientOptions.value[index] = []
      }
      ingredientOptions.value[index] = itemsStore.sortedItemsWithRecent.slice(0, 20)
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    const filtered = itemsStore.sortedItemsWithRecent
      .filter(item => item.name.toLowerCase().includes(needle))
      .slice(0, 20)

    if (!ingredientOptions.value[index]) {
      ingredientOptions.value[index] = []
    }
    ingredientOptions.value[index] = filtered
  })
}

const handleItemSelect = (index: number, val: any) => {
  const ingredient = formIngredients.value[index]
  if (!ingredient) return

  if (val && val._id) {
    ingredient.itemId = val._id
    ingredient.itemName = val.name
    ingredient.unit = val.defaultUnit || ingredient.unit || 'pcs'

    // Mark item as recently used
    itemsStore.markItemsAsUsed([val._id])
  } else if (typeof val === 'string') {
    ingredient.itemName = val
    ingredient.itemId = undefined
  }
}

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

  const newItem = itemsStore.sortedItems.find(item => item.name === data.name)
  if (newItem && currentIngredientIndex.value !== null) {
    const ingredient = formIngredients.value[currentIngredientIndex.value]
    if (ingredient) {
      ingredient.itemId = newItem._id
      ingredient.itemName = newItem.name
      ingredient.unit = newItem.defaultUnit || ingredient.unit || 'pcs'
    }

    const selectRef = ingredientSelectRefs.value[currentIngredientIndex.value]
    if (selectRef) {
      selectRef.hidePopup()
    }
  }

  showAddItemDialog.value = false

  $q.notify({
    type: 'positive',
    message: `Item "${data.name}" created successfully`
  })
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
</script>

<template>
  <div>
    <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :full-width="$q.screen.lt.sm" :maximized="$q.screen.lt.sm">
      <q-card :style="$q.screen.lt.sm ? 'height: 100vh; max-height: 100vh; display: flex; flex-direction: column' : 'width: 100%; max-width: 600px; max-height: 80vh'">
        <q-card-section>
          <div class="text-h6">
            {{ readOnly ? 'View Recipe' : (editingRecipe ? 'Edit Recipe' : 'Add New Recipe') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none" :style="$q.screen.lt.sm ? 'flex: 1; overflow-y: auto' : 'max-height: 60vh; overflow-y: auto'">
          <!-- Basic Information -->
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Basic Information</div>

          <q-input
            v-model="formName"
            outlined
            label="Recipe Name *"
            class="q-mb-md"
            :readonly="readOnly"
            :disable="readOnly"
          />

          <q-input
            v-model="formDescription"
            outlined
            label="Description"
            type="textarea"
            rows="2"
            class="q-mb-md"
            :readonly="readOnly"
            :disable="readOnly"
          />

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <q-input
                v-model="formIcon"
                outlined
                label="Icon (emoji)"
                placeholder="🍽️"
                :readonly="readOnly"
                :disable="readOnly"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="formServings"
                outlined
                label="Servings *"
                type="number"
                min="1"
                :readonly="readOnly"
                :disable="readOnly"
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

          <!-- Tags -->
          <TagSelector
            v-model="formTags"
            label="Tags"
            class="q-mb-md"
            :readonly="readOnly"
          />

          <q-separator class="q-my-md" />

          <!-- Ingredients -->
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            Ingredients
          </div>

          <div
            v-for="(ingredient, index) in formIngredients"
            :key="index"
            class="q-mb-sm"
          >
            <!-- Ingredient dropdown on its own row -->
            <div class="row q-col-gutter-sm q-mb-xs">
              <div class="col-12">
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
            </div>
            <!-- Quantity, Unit, and Remove button on second row -->
            <div class="row q-col-gutter-sm">
              <div class="col-5">
                <q-input
                  v-model.number="ingredient.quantity"
                  outlined
                  dense
                  label="Quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  :readonly="readOnly"
                  :disable="readOnly"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="ingredient.unit"
                  outlined
                  dense
                  label="Unit"
                  placeholder="kg, pcs"
                  :readonly="readOnly"
                  :disable="readOnly"
                />
              </div>
              <div v-if="!readOnly" class="col-1 flex items-center">
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
          </div>

          <!-- Add Ingredient Button -->
          <div v-if="!readOnly" class="row q-mb-sm">
            <div class="col-12 flex justify-center">
              <q-btn
                flat
                dense
                round
                icon="add"
                size="sm"
                color="primary"
                @click="addIngredient"
              >
                <q-tooltip>Add ingredient</q-tooltip>
              </q-btn>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Instructions -->
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            Instructions
          </div>

          <div
            v-for="(_instruction, index) in formInstructions"
            :key="index"
            class="row q-col-gutter-sm q-mb-sm"
          >
            <div class="col-1 flex items-center justify-center">
              <span class="text-weight-bold">{{ index + 1 }}.</span>
            </div>
            <div :class="readOnly ? 'col-11' : 'col-10'">
              <q-input
                v-model="formInstructions[index]"
                outlined
                dense
                type="textarea"
                rows="2"
                :label="`Step ${index + 1}`"
                placeholder="Describe this step..."
                :readonly="readOnly"
                :disable="readOnly"
              />
            </div>
            <div v-if="!readOnly" class="col-1 flex items-center">
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

          <!-- Add Instruction Button -->
          <div v-if="!readOnly" class="row q-mb-sm">
            <div class="col-12 flex justify-center">
              <q-btn
                flat
                dense
                round
                icon="add"
                size="sm"
                color="primary"
                @click="addInstruction"
              >
                <q-tooltip>Add instruction step</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="readOnly ? 'Close' : 'Cancel'" color="primary" @click="handleCloseDialog" />
          <q-btn
            v-if="!readOnly"
            label="Save"
            color="primary"
            @click="handleSaveRecipe"
            :disable="!isFormValid()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Item Dialog -->
    <AddItemDialog
      v-model="showAddItemDialog"
      title="Add New Item"
      :initial-data="addItemDialogInitialData"
      :show-pantry-fields="false"
      :show-global-toggle="canCreateGlobalItem"
      @save="handleSaveNewItem"
    />
  </div>
</template>
