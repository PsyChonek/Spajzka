<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { GlobalRecipe, CreateMealPlanEntryRequest } from '@shared/api-client'
import type { MealPlanEntry } from '@shared/api-client'
import { matchesQuery } from '@/utils/search'
import { toISODate } from '@/utils/date'
import BaseDialog from './BaseDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import QCalendarMonthPlugin from '@quasar/quasar-ui-qcalendar/QCalendarMonth'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QCalendarMonth = (QCalendarMonthPlugin as any).QCalendarMonth ?? QCalendarMonthPlugin
const weekdaysMondayFirst = [1, 2, 3, 4, 5, 6, 0]

const recipesStore = useRecipesStore()

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  initialData?: Partial<MealPlanEntry>
  defaultCookDate?: string
  defaultEatDates?: string[]
  defaultRecipe?: Recipe
}

const props = withDefaults(defineProps<Props>(), { mode: 'add' })

export interface MealPlanEntryPayload {
  recipeId: string
  recipeType: CreateMealPlanEntryRequest.recipeType
  cookDate: string
  servings?: number
  eatDates?: string[]
  mealTypes?: string[]
  notes?: string
}

export interface DeletePayload {
  id: string
  removeShoppingItems: boolean
}

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast', icon: 'free_breakfast' },
  { value: 'lunch', label: 'Lunch', icon: 'lunch_dining' },
  { value: 'dinner', label: 'Dinner', icon: 'dinner_dining' }
] as const

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: MealPlanEntryPayload): void
  (e: 'delete', data: DeletePayload): void
}>()

const selectedRecipe = ref<Recipe | null>(null)
const cookDate = ref('')
const servings = ref<number | undefined>(undefined)
const eatDates = ref<string[]>([])
const mealTypes = ref<string[]>([])
const notes = ref('')

function toggleMealType(value: string) {
  const idx = mealTypes.value.indexOf(value)
  if (idx >= 0) mealTypes.value.splice(idx, 1)
  else mealTypes.value.push(value)
}

const recipeFilter = ref('')

const filteredRecipes = computed(() => {
  if (!recipeFilter.value.trim()) return recipesStore.sortedItems
  return recipesStore.sortedItems.filter((r) =>
    matchesQuery(recipeFilter.value, r.name, ...((r.searchNames as string[] | undefined) ?? []))
  )
})

function filterRecipes(val: string, update: (fn: () => void) => void) {
  update(() => {
    recipeFilter.value = val
  })
}

const showDeleteConfirm = ref(false)
const removeShoppingItems = ref(false)

const hasGeneratedShopping = computed(
  () => props.mode === 'edit' && !!props.initialData?.shoppingBatchId
)

const todayStr = computed(() => toISODate(new Date()))
const pickerDate = ref<string>(toISODate(new Date()))
const pickerMonth = computed(() => pickerDate.value.slice(0, 7))

function isOutsideMonth(date: string) {
  return date.slice(0, 7) !== pickerMonth.value
}

function toggleEatDate(date: string) {
  const idx = eatDates.value.indexOf(date)
  if (idx >= 0) eatDates.value.splice(idx, 1)
  else eatDates.value.push(date)
}

function shiftPickerMonth(direction: -1 | 1) {
  const [y, m] = pickerDate.value.split('-').map(Number)
  pickerDate.value = toISODate(new Date(y!, (m! - 1) + direction, 1))
}

function pickerToday() {
  pickerDate.value = toISODate(new Date())
}

const pickerLabel = computed(() => {
  const [y, m] = pickerDate.value.split('-').map(Number)
  return new Date(y!, m! - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) populateForm()
  }
)

function populateForm() {
  if (props.mode === 'edit' && props.initialData) {
    const d = props.initialData
    selectedRecipe.value = recipesStore.items.find((r) => r._id === d.recipeId) ?? null
    cookDate.value = d.cookDate?.slice(0, 10) ?? ''
    servings.value = d.servings
    eatDates.value = d.eatDates ? [...d.eatDates.map(x => x.slice(0, 10))] : []
    mealTypes.value = Array.isArray(d.mealTypes) ? [...d.mealTypes] : []
    notes.value = d.notes ?? ''
  } else {
    selectedRecipe.value = props.defaultRecipe ?? null
    cookDate.value = props.defaultCookDate?.slice(0, 10) ?? ''
    servings.value = undefined
    eatDates.value = props.defaultEatDates ? [...props.defaultEatDates] : []
    mealTypes.value = []
    notes.value = ''
  }
  recipeFilter.value = ''
  pickerDate.value = cookDate.value || eatDates.value[0] || toISODate(new Date())
}

const isValid = computed(() => !!selectedRecipe.value && !!cookDate.value)

function handleClose() {
  showDeleteConfirm.value = false
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
    mealTypes: mealTypes.value.length > 0 ? [...mealTypes.value] : undefined,
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
  <BaseDialog
    :model-value="modelValue"
    :title="mode === 'edit' ? 'Edit meal' : 'Add meal'"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
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

    <q-input
      v-model="cookDate"
      label="Cook date *"
      type="date"
      outlined
      class="q-mb-md"
    />

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

    <div class="sp-meal__field">
      <div class="sp-form-label">Eat dates</div>
      <div class="sp-meal__hint">For leftovers — leave empty to use cook date</div>
      <div class="sp-meal__date-picker">
        <div class="sp-meal__cal-toolbar">
          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            aria-label="Previous month"
            @click="shiftPickerMonth(-1)"
          />
          <div class="sp-meal__cal-title">{{ pickerLabel }}</div>
          <q-btn flat dense no-caps label="Today" @click="pickerToday" />
          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            aria-label="Next month"
            @click="shiftPickerMonth(1)"
          />
        </div>
        <QCalendarMonth
          v-model="pickerDate"
          :short-weekday-label="false"
          :weekdays="weekdaysMondayFirst"
          :show-month-label="false"
          class="sp-meal__cal"
        >
          <template #head-day-button></template>
          <template #day="{ scope }">
            <div
              class="sp-meal__cal-cell"
              :class="{
                'sp-meal__cal-cell--selected': eatDates.includes(scope.timestamp.date),
                'sp-meal__cal-cell--outside': isOutsideMonth(scope.timestamp.date),
                'sp-meal__cal-cell--today': scope.timestamp.date === todayStr
              }"
              @click="toggleEatDate(scope.timestamp.date)"
            >
              {{ scope.timestamp.day }}
            </div>
          </template>
        </QCalendarMonth>
      </div>
    </div>

    <div class="sp-meal__field">
      <div class="sp-form-label">Meal type</div>
      <div class="sp-meal__chips">
        <button
          v-for="opt in MEAL_TYPE_OPTIONS"
          :key="opt.value"
          type="button"
          class="sp-meal__chip"
          :class="{ 'sp-meal__chip--active': mealTypes.includes(opt.value) }"
          @click="toggleMealType(opt.value)"
        >
          <q-icon :name="opt.icon" size="18px" class="q-mr-xs" />
          {{ opt.label }}
        </button>
      </div>
    </div>

    <q-input
      v-model="notes"
      label="Notes"
      type="textarea"
      outlined
      autogrow
      :rows="2"
      :max-rows="3"
    />

    <div v-if="hasGeneratedShopping" class="sp-meal__shopping-note q-mt-md">
      <q-icon name="shopping_cart" size="16px" class="q-mr-xs" />
      Ingredients have been added to the shopping list.
    </div>

    <template #footer>
      <q-btn
        v-if="mode === 'edit'"
        flat
        no-caps
        label="Delete"
        color="negative"
        icon="delete"
        class="sp-dlg-footer__leading"
        @click="handleDeleteClick"
      />
      <q-btn flat no-caps label="Cancel" color="grey-8" @click="handleClose" />
      <q-btn
        unelevated
        no-caps
        label="Save"
        color="primary"
        :disable="!isValid"
        @click="handleSave"
      />
    </template>
  </BaseDialog>

  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="Delete meal entry"
    message="Are you sure you want to remove this meal from the calendar?"
    type="danger"
    confirm-label="Delete"
    @confirm="handleDeleteConfirmed"
  >
    <q-toggle
      v-if="hasGeneratedShopping"
      v-model="removeShoppingItems"
      label="Also remove generated shopping items"
      color="negative"
      class="q-mt-md"
    />
  </ConfirmDialog>
</template>

<style scoped>
.sp-meal__field {
  margin-bottom: 16px;
}

.sp-meal__hint {
  font-size: 0.78rem;
  color: var(--sp-text-soft);
  margin-bottom: 8px;
}

.sp-meal__date-picker {
  width: 100%;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  background: var(--sp-surface);
  padding: 8px;
}

.sp-meal__cal-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px 8px;
}

.sp-meal__cal-title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--sp-text);
  text-transform: capitalize;
}

.sp-meal__cal :deep(.q-calendar-month__day-label) {
  display: none;
}

.sp-meal__cal :deep(.q-calendar-month__day) {
  cursor: pointer;
  min-height: 36px;
}

.sp-meal__cal :deep(.q-calendar-month__day-content) {
  height: 100%;
}

.sp-meal__cal-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 32px;
  font-size: 0.85rem;
  color: var(--sp-text);
  border-radius: var(--sp-r-sm, 6px);
  user-select: none;
  transition: background 0.1s, color 0.1s;
}

.sp-meal__cal-cell:hover {
  background: var(--sp-surface-2);
}

.sp-meal__cal-cell--outside {
  color: var(--sp-text-soft);
  opacity: 0.55;
}

.sp-meal__cal-cell--today {
  font-weight: 700;
  outline: 1px solid var(--sp-secondary);
  outline-offset: -2px;
}

.sp-meal__cal-cell--selected,
.sp-meal__cal-cell--selected:hover {
  background: var(--sp-primary);
  color: #fff;
  font-weight: 700;
}

.sp-meal__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sp-meal__chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: var(--sp-r-pill);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface);
  color: var(--sp-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sp-meal__chip:hover {
  border-color: var(--sp-secondary);
  color: var(--sp-text);
}

.sp-meal__chip--active {
  background: var(--sp-secondary);
  border-color: var(--sp-secondary);
  color: #fff;
}

.sp-meal__shopping-note {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--sp-text-muted);
}
</style>
