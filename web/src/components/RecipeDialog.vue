<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Notify } from 'quasar'
import type { Recipe } from '@/stores/recipesStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useAuthStore } from '@/stores/authStore'
import { GlobalRecipe, GroupRecipe, type RecipeIngredient } from '@shared/api-client'
import { matchesQuery } from '@/utils/search'
import BaseDialog from './BaseDialog.vue'
import AddItemDialog, { type ItemFormData } from './AddItemDialog.vue'
import TagSelector from './TagSelector.vue'
import { allowedUnits, type UnitType } from '@shared/units'

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
  searchNames?: string[]
  recipeType?: GlobalRecipe.recipeType | GroupRecipe.recipeType
}

const itemsStore = useItemsStore()
const authStore = useAuthStore()

onMounted(() => {
  if (itemsStore.allItems.length === 0) itemsStore.fetchItems()
})

const formName = ref('')
const formDescription = ref('')
const formIcon = ref('')
const formServings = ref(4)
const formRecipeType = ref<GlobalRecipe.recipeType | GroupRecipe.recipeType>(GlobalRecipe.recipeType.GLOBAL)
const formIngredients = ref<RecipeIngredient[]>([{ itemName: '', quantity: 1, unit: 'pcs' }])
const formInstructions = ref<string[]>([''])
const formTags = ref<string[]>([])
const formSearchNames = ref('')

const showAddItemDialog = ref(false)
const addItemDialogInitialData = ref<Partial<ItemFormData>>({})
const currentIngredientIndex = ref<number | null>(null)

const ingredientOptions = ref<any[][]>([])
const currentIngredientSearchValue = ref<string[]>([])
const ingredientSelectRefs = ref<any[]>([])

const canCreateGlobalRecipe = computed(() =>
  authStore.hasGlobalPermission('global_recipes:create')
)

const ingredientUnitChoices = computed(() => {
  return formIngredients.value.map((ing) => {
    if (!ing.itemId) return null
    const item: any = itemsStore.sortedItemsWithRecent.find((i: any) => i._id === ing.itemId)
    if (!item?.unitType || item.unitType === 'custom') return null
    return allowedUnits(item.unitType as UnitType)
  })
})

const canCreateGlobalItem = computed(() =>
  authStore.hasGlobalPermission('global_items:create')
)

const dialogTitle = computed(() =>
  props.readOnly ? 'View recipe' : (props.editingRecipe ? 'Edit recipe' : 'Add new recipe')
)

const handleCloseDialog = () => {
  emit('update:modelValue', false)
  emit('cancel')
  resetForm()
}

const resetForm = () => {
  formRecipeType.value = GroupRecipe.recipeType.GROUP
  formName.value = props.initialName || ''
  formDescription.value = ''
  formIcon.value = ''
  formServings.value = 4
  formIngredients.value = [{ itemName: '', quantity: 1, unit: 'pcs' }]
  formInstructions.value = ['']
  formTags.value = []
  formSearchNames.value = ''
}

function resolveIngredientName(ing: RecipeIngredient): RecipeIngredient {
  if (ing.itemId) {
    const item = itemsStore.allItems.find(i => i._id === ing.itemId)
    if (item) return { ...ing, itemName: item.name }
  }
  return { ...ing }
}

watch(() => props.editingRecipe, (recipe) => {
  if (recipe) {
    formRecipeType.value = recipe.recipeType
    formName.value = recipe.name
    formDescription.value = recipe.description || ''
    formIcon.value = recipe.icon || ''
    formServings.value = recipe.servings
    formIngredients.value = recipe.ingredients?.length > 0
      ? recipe.ingredients.map(resolveIngredientName)
      : [{ itemName: '', quantity: 1, unit: 'pcs' }]
    formInstructions.value = recipe.instructions?.length > 0
      ? [...recipe.instructions]
      : ['']
    formTags.value = recipe.tags || []
    formSearchNames.value = Array.isArray(recipe.searchNames) ? recipe.searchNames.join(', ') : ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Re-resolve ingredient names from the catalog when the items store loads
// after the dialog has already opened (offline-first cold-start case).
watch(() => itemsStore.allItems.length, () => {
  for (const ing of formIngredients.value) {
    if (ing.itemId) {
      const item = itemsStore.allItems.find(i => i._id === ing.itemId)
      if (item && item.name && ing.itemName !== item.name) {
        ing.itemName = item.name
      }
    }
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
    tags: formTags.value,
    searchNames: formSearchNames.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }

  if (!props.editingRecipe) recipeData.recipeType = formRecipeType.value

  emit('save', recipeData)
  emit('update:modelValue', false)
  resetForm()
}

const isFormValid = () => {
  if (!formName.value.trim()) return false
  if (formServings.value < 1) return false
  const hasIngredients = formIngredients.value.some(ing => ing.itemName.trim())
  const hasInstructions = formInstructions.value.some(inst => inst.trim())
  return hasIngredients && hasInstructions
}

const addIngredient = () => {
  formIngredients.value.push({ itemName: '', quantity: 1, unit: 'pcs' })
}

const removeIngredient = (index: number) => {
  if (formIngredients.value.length > 1) formIngredients.value.splice(index, 1)
}

const getItemOptions = (index: number, val: string, update: any) => {
  currentIngredientSearchValue.value[index] = val

  if (val === '') {
    update(() => {
      if (!ingredientOptions.value[index]) ingredientOptions.value[index] = []
      ingredientOptions.value[index] = itemsStore.sortedItemsWithRecent.slice(0, 20)
    })
    return
  }

  update(() => {
    const filtered = itemsStore.sortedItemsWithRecent
      .filter(item => matchesQuery(val, item.name, ...(item.searchNames ?? [])))
      .slice(0, 20)
    if (!ingredientOptions.value[index]) ingredientOptions.value[index] = []
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
    if (selectRef) selectRef.hidePopup()
  }

  showAddItemDialog.value = false
  Notify.create({ type: 'positive', message: `Item "${data.name}" created successfully` })
}

const addInstruction = () => {
  formInstructions.value.push('')
}

const removeInstruction = (index: number) => {
  if (formInstructions.value.length > 1) formInstructions.value.splice(index, 1)
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="dialogTitle"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleCloseDialog"
  >
    <!-- Basic Information -->
    <h3 class="sp-form-label">Basic information</h3>

    <q-input
      v-model="formName"
      outlined
      label="Recipe name *"
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

    <q-input
      v-model="formSearchNames"
      outlined
      label="Alternative names"
      hint="Comma-separated. Diacritic-insensitive search, e.g. palačinky, lívance"
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

    <q-toggle
      v-if="!editingRecipe && canCreateGlobalRecipe"
      v-model="formRecipeType"
      true-value="global"
      false-value="group"
      label="Add as global recipe"
      color="primary"
      class="q-mb-md"
    >
      <q-tooltip>
        Global recipes are visible to all users and can only be managed by system moderators
      </q-tooltip>
    </q-toggle>

    <TagSelector
      v-model="formTags"
      label="Tags"
      class="q-mb-md"
      :readonly="readOnly"
    />

    <q-separator class="q-my-lg" />

    <!-- Ingredients -->
    <h3 class="sp-form-label">Ingredients</h3>

    <div
      v-for="(ingredient, index) in formIngredients"
      :key="index"
      class="sp-recipe__row"
    >
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
        new-value-mode="add-unique"
        fill-input
        hide-selected
        class="q-mb-xs"
        @filter="(val, update) => getItemOptions(index, val, update)"
        @update:model-value="(val) => handleItemSelect(index, val)"
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
            <q-item-section class="text-grey">No items found</q-item-section>
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
          <q-select
            v-if="ingredientUnitChoices[index]"
            v-model="ingredient.unit"
            :options="ingredientUnitChoices[index] || []"
            outlined
            dense
            label="Unit"
            :readonly="readOnly"
            :disable="readOnly"
          />
          <q-input
            v-else
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
            icon="close"
            size="sm"
            color="grey-7"
            :disable="formIngredients.length === 1"
            @click="removeIngredient(index)"
          >
            <q-tooltip>Remove ingredient</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <q-btn
      v-if="!readOnly"
      flat
      no-caps
      dense
      icon="add"
      label="Add ingredient"
      color="primary"
      class="sp-recipe__add-btn"
      @click="addIngredient"
    />

    <q-separator class="q-my-lg" />

    <!-- Instructions -->
    <h3 class="sp-form-label">Instructions</h3>

    <div
      v-for="(_instruction, index) in formInstructions"
      :key="index"
      class="sp-recipe__instruction"
    >
      <span class="sp-recipe__step-num">{{ index + 1 }}</span>
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
        class="sp-recipe__instruction-input"
      />
      <q-btn
        v-if="!readOnly"
        flat
        dense
        round
        icon="close"
        size="sm"
        color="grey-7"
        :disable="formInstructions.length === 1"
        @click="removeInstruction(index)"
      >
        <q-tooltip>Remove step</q-tooltip>
      </q-btn>
    </div>

    <q-btn
      v-if="!readOnly"
      flat
      no-caps
      dense
      icon="add"
      label="Add step"
      color="primary"
      class="sp-recipe__add-btn"
      @click="addInstruction"
    />

    <template #footer>
      <q-btn
        flat
        no-caps
        :label="readOnly ? 'Close' : 'Cancel'"
        color="grey-8"
        @click="handleCloseDialog"
      />
      <q-btn
        v-if="!readOnly"
        unelevated
        no-caps
        label="Save"
        color="primary"
        :disable="!isFormValid()"
        @click="handleSaveRecipe"
      />
    </template>
  </BaseDialog>

  <AddItemDialog
    v-model="showAddItemDialog"
    title="Add new item"
    :initial-data="addItemDialogInitialData"
    :show-pantry-fields="false"
    :show-global-toggle="canCreateGlobalItem"
    @save="handleSaveNewItem"
  />
</template>

<style scoped>
.sp-recipe__row {
  background: var(--sp-surface-2);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  padding: 10px 10px 6px;
  margin-bottom: 8px;
}

.sp-recipe__add-btn {
  margin-top: 4px;
}

.sp-recipe__instruction {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.sp-recipe__step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: 6px;
}

.sp-recipe__instruction-input {
  flex: 1;
  min-width: 0;
}
</style>
