<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { useBackButton } from '@/composables/useBackButton'
import { GlobalRecipe, CreateMealPlanEntryRequest } from '@shared/api-client'
import type { MealPlanEntry } from '@shared/api-client'

const $q = useQuasar()
const recipesStore = useRecipesStore()

// ---- Props & emits ----

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  initialData?: Partial<MealPlanEntry>
  defaultCookDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'add'
})

export interface MealPlanEntryPayload {
  recipeId: string
  recipeType: CreateMealPlanEntryRequest.recipeType
  cookDate: string
  servings?: number
  eatDates?: string[]
  mealType?: string
  notes?: string
}

export interface DeletePayload {
  id: string
  removeShoppingItems: boolean
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: MealPlanEntryPayload): void
  (e: 'delete', data: DeletePayload): void
}>()

// ---- Form state ----

const selectedRecipe = ref<Recipe | null>(null)
const cookDate = ref('')
const servings = ref<number | undefined>(undefined)
const eatDates = ref<string[]>([])
const mealType = ref<string | undefined>(undefined)
const notes = ref('')

// Recipe picker filter
const recipeFilter = ref('')

const filteredRecipes = computed(() => {
  const q = recipeFilter.value.toLowerCase().trim()
  if (!q) return recipesStore.sortedItems
  return recipesStore.sortedItems.filter((r) =>
    r.name.toLowerCase().includes(q)
  )
})

function filterRecipes(val: string, update: (fn: () => void) => void) {
  update(() => {
    recipeFilter.value = val
  })
}

// Meal-type suggestions
const mealTypeSuggestions = ['breakfast', 'lunch', 'dinner', 'snack']

// ---- Delete confirm state ----

const showDeleteConfirm = ref(false)
const removeShoppingItems = ref(false)

// ---- Back button ----

const { pushHistoryState, removeHistoryState } = useBackButton(
  () => props.modelValue,
  () => handleClose()
)

// ---- Watch ----

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      pushHistoryState()
      populateForm()
    } else {
      removeHistoryState()
    }
  }
)

function populateForm() {
  if (props.mode === 'edit' && props.initialData) {
    const d = props.initialData
    selectedRecipe.value = recipesStore.items.find((r) => r._id === d.recipeId) ?? null
    cookDate.value = d.cookDate?.slice(0, 10) ?? ''
    servings.value = d.servings
    eatDates.value = d.eatDates ? [...d.eatDates] : []
    mealType.value = d.mealType
    notes.value = d.notes ?? ''
  } else {
    selectedRecipe.value = null
    cookDate.value = props.defaultCookDate?.slice(0, 10) ?? ''
    servings.value = undefined
    eatDates.value = []
    mealType.value = undefined
    notes.value = ''
  }
  recipeFilter.value = ''
}

// ---- Validation ----

const isValid = computed(() => !!selectedRecipe.value && !!cookDate.value)

// ---- Actions ----

function handleClose() {
  emit('update:modelValue', false)
}

function handleSave() {
  if (!isValid.value || !selectedRecipe.value) return

  const recipeType =
    selectedRecipe.value.recipeType === GlobalRecipe.recipeType.GLOBAL
      ? CreateMealPlanEntryRequest.recipeType.GLOBAL
      : CreateMealPlanEntryRequest.recipeType.GROUP

  emit('save', {
    recipeId: selectedRecipe.value._id!,
    recipeType,
    cookDate: cookDate.value,
    servings: servings.value || undefined,
    eatDates: eatDates.value.length > 0 ? eatDates.value : undefined,
    mealType: mealType.value || undefined,
    notes: notes.value.trim() || undefined
  })
  emit('update:modelValue', false)
}

function handleDeleteClick() {
  removeShoppingItems.value = false
  showDeleteConfirm.value = true
}

function handleDeleteConfirmed() {
  const id = props.initialData?._id
  if (!id) return
  showDeleteConfirm.value = false
  emit('delete', { id, removeShoppingItems: removeShoppingItems.value })
  emit('update:modelValue', false)
}

function parseServings(val: string | number | null) {
  if (val === null || val === '') {
    servings.value = undefined
    return
  }
  const n = Number(val)
  servings.value = isNaN(n) || n <= 0 ? undefined : n
}
</script>

<template>
  <!-- Main entry dialog -->
  <q-dialog
    :model-value="modelValue && !showDeleteConfirm"
    @update:model-value="emit('update:modelValue', $event)"
    :full-width="$q.screen.lt.sm"
    :maximized="$q.screen.lt.sm"
  >
    <q-card
      :style="$q.screen.lt.sm
        ? 'height: 100vh; max-height: 100vh; display: flex; flex-direction: column'
        : 'width: 100%; max-width: 480px'"
    >
      <q-card-section>
        <div class="text-h6">{{ mode === 'edit' ? 'Edit Meal' : 'Add Meal' }}</div>
      </q-card-section>

      <q-card-section
        class="q-pt-none"
        :style="$q.screen.lt.sm ? 'flex: 1; overflow-y: auto' : ''"
      >
        <!-- Recipe picker -->
        <q-select
          v-model="selectedRecipe"
          :options="filteredRecipes"
          option-label="name"
          option-value="_id"
          label="Recipe *"
          outlined
          use-input
          input-debounce="300"
          class="q-mb-md"
          :readonly="mode === 'edit'"
          :disable="mode === 'edit'"
          @filter="filterRecipes"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section avatar>
                <span style="font-size: 1.4rem">{{ opt.icon || '🍽️' }}</span>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
                <q-item-label caption>{{ opt.recipeType }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #selected-item="{ opt }">
            <span class="q-mr-sm">{{ opt?.icon || '🍽️' }}</span>
            <span>{{ opt?.name }}</span>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No recipes found</q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Cook date -->
        <q-input
          v-model="cookDate"
          label="Cook date *"
          type="date"
          outlined
          class="q-mb-md"
        />

        <!-- Servings -->
        <q-input
          :model-value="servings ?? ''"
          label="Servings"
          type="number"
          min="0.5"
          step="0.5"
          outlined
          placeholder="(uses recipe default)"
          class="q-mb-md"
          @update:model-value="parseServings"
        />

        <!-- Eat dates (multi-date picker) -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">Eat dates (for leftovers — leave empty to use cook date)</div>
          <q-date
            v-model="eatDates"
            multiple
            flat
            minimal
            class="eat-dates-picker"
          />
        </div>

        <!-- Meal type -->
        <q-select
          v-model="mealType"
          :options="mealTypeSuggestions"
          label="Meal type"
          outlined
          use-input
          new-value-mode="add-unique"
          clearable
          class="q-mb-md"
        />

        <!-- Notes -->
        <q-input
          v-model="notes"
          label="Notes"
          type="textarea"
          outlined
          autogrow
          :rows="2"
          :max-rows="3"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="mode === 'edit'"
          flat
          label="Delete"
          color="negative"
          icon="delete"
          @click="handleDeleteClick"
          class="q-mr-auto"
        />
        <q-btn flat label="Cancel" color="primary" @click="handleClose" />
        <q-btn
          label="Save"
          color="primary"
          :disable="!isValid"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Delete confirmation dialog (shown in place of entry dialog) -->
  <q-dialog v-model="showDeleteConfirm" persistent>
    <q-card style="width: 100%; max-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="warning" color="negative" size="32px" class="q-mr-md" />
        <div class="text-h6">Delete meal entry</div>
      </q-card-section>

      <q-card-section>
        <div class="text-body1 q-mb-md">Are you sure you want to remove this meal from the calendar?</div>
        <q-toggle
          v-model="removeShoppingItems"
          label="Also remove generated shopping items"
          color="negative"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey-7" @click="showDeleteConfirm = false" />
        <q-btn flat label="Delete" color="negative" @click="handleDeleteConfirmed" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.eat-dates-picker {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}
</style>
