<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// The dist default export is the Quasar plugin wrapper `{ QCalendarMonth, install, … }`
// — not the component itself. Pull the component off the plugin object.
// (The package's .d.ts only declares the default, so named imports fail type-check.)
import QCalendarMonthPlugin from '@quasar/quasar-ui-qcalendar/QCalendarMonth'
import QCalendarAgendaPlugin from '@quasar/quasar-ui-qcalendar/QCalendarAgenda'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QCalendarMonth = (QCalendarMonthPlugin as any).QCalendarMonth ?? QCalendarMonthPlugin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QCalendarAgenda = (QCalendarAgendaPlugin as any).QCalendarAgenda ?? QCalendarAgendaPlugin
import { useMealPlan } from '@/composables/useStores'
import { useRecipesStore } from '@/stores/recipesStore'
import { toISODate } from '@/utils/date'
import type { MealPlanEntry } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import MealPlanEntryDialog from '@/components/MealPlanEntryDialog.vue'
import ShoppingPreviewDialog from '@/components/ShoppingPreviewDialog.vue'

const mealPlan = useMealPlan()
const recipesStore = useRecipesStore()

// --- Calendar state ---
type CalendarView = 'month' | 'week' | 'agenda'
const calendarView = ref<CalendarView>('month')
// QCalendar uses YYYY-MM-DD for modelValue
const selectedDate = ref<string>(toISODate(new Date()))

// The label shown in the toolbar (month/year or week range)
const dateLabel = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  // For week/agenda: show week range
  const dayOfWeek = d.getUTCDay()
  const weekStart = new Date(d)
  weekStart.setUTCDate(d.getUTCDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(weekStart)} – ${fmt(weekEnd)}, ${weekStart.getUTCFullYear()}`
})

// --- Date navigation ---
function goToday() {
  selectedDate.value = toISODate(new Date())
}

function navigate(direction: -1 | 1) {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    d.setUTCMonth(d.getUTCMonth() + direction)
    d.setUTCDate(1)
  } else {
    d.setUTCDate(d.getUTCDate() + direction * 7)
  }
  // Don't call maybeExtendRange here — QCalendar emits @change after the model
  // update, which routes through onCalendarChange below.
  selectedDate.value = toISODate(d)
}

/** Extend the loaded range if the selected date is near the edges. */
function maybeExtendRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z')
  const from = toISODate(new Date(d.getTime() - 60 * 86400_000))
  const to = toISODate(new Date(d.getTime() + 60 * 86400_000))
  mealPlan.fetchRange(from, to)
}

// QCalendar @change event payload
function onCalendarChange(data: any) {
  // data.start.date is the first visible date in the calendar
  if (data?.start?.date) {
    maybeExtendRange(data.start.date)
  }
}

// --- Entry dialog state ---
const showEntryDialog = ref(false)
const entryDialogMode = ref<'add' | 'edit'>('add')
const entryInitialData = ref<Partial<MealPlanEntry> | undefined>(undefined)
const entryDefaultCookDate = ref<string | undefined>(undefined)

function openAddEntry(cookDate?: string) {
  entryDialogMode.value = 'add'
  entryInitialData.value = undefined
  entryDefaultCookDate.value = cookDate ?? selectedDate.value
  showEntryDialog.value = true
}

function openEditEntry(entry: MealPlanEntry) {
  entryDialogMode.value = 'edit'
  entryInitialData.value = entry
  entryDefaultCookDate.value = undefined
  showEntryDialog.value = true
}

async function handleEntrySave(data: any) {
  if (entryDialogMode.value === 'edit' && entryInitialData.value?._id) {
    await mealPlan.updateEntry(entryInitialData.value._id, {
      cookDate: data.cookDate,
      servings: data.servings,
      eatDates: data.eatDates,
      mealTypes: data.mealTypes,
      notes: data.notes
    })
  } else {
    await mealPlan.addEntry(data)
  }
}

async function handleEntryDelete(payload: { id: string; removeShoppingItems: boolean }) {
  await mealPlan.deleteEntry(payload.id, payload.removeShoppingItems)
}

// --- Shopping preview dialog ---
const showShoppingPreview = ref(false)

// Compute the visible date range based on current view for the "Generate Shopping" button
const shoppingFrom = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    d.setUTCDate(1)
    return toISODate(d)
  }
  // Week view: start of visible week
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return toISODate(d)
})

const shoppingTo = computed(() => {
  const d = new Date(shoppingFrom.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    d.setUTCMonth(d.getUTCMonth() + 1)
    d.setUTCDate(0) // last day of month
    return toISODate(d)
  }
  d.setUTCDate(d.getUTCDate() + 6)
  return toISODate(d)
})

// --- Day click ---
function onDayClick(data: any) {
  // QCalendarMonth emits { scope: { timestamp: { date } } }
  const date = data?.scope?.timestamp?.date ?? data?.timestamp?.date ?? data?.date
  if (date) {
    selectedDate.value = date
    openAddEntry(date)
  }
}

// --- Render helpers ---
function entriesForDate(dateStr: string): MealPlanEntry[] {
  return mealPlan.entriesExpandedByEatDate.value[dateStr] ?? []
}

function truncate(str: string | undefined, max = 20): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// --- Mount ---
onMounted(async () => {
  await mealPlan.fetchItems()
  await recipesStore.fetchItems()
})
</script>

<template>
  <PageWrapper max-width="1400px">
    <div class="meal-plan-view">
      <!-- Toolbar -->
      <div class="toolbar row items-center q-mb-md q-gutter-sm">
        <!-- View toggle -->
        <q-btn-group flat>
          <q-btn
            flat
            label="Month"
            :color="calendarView === 'month' ? 'primary' : 'grey-7'"
            @click="calendarView = 'month'"
          />
          <q-btn
            flat
            label="Week"
            :color="calendarView === 'week' ? 'primary' : 'grey-7'"
            @click="calendarView = 'week'"
          />
          <q-btn
            flat
            label="Agenda"
            :color="calendarView === 'agenda' ? 'primary' : 'grey-7'"
            @click="calendarView = 'agenda'"
          />
        </q-btn-group>

        <!-- Today / Prev / Next -->
        <q-btn flat dense label="Today" @click="goToday" />
        <q-btn flat dense round icon="chevron_left" @click="navigate(-1)" />
        <q-btn flat dense round icon="chevron_right" @click="navigate(1)" />

        <span class="date-label text-subtitle1 text-weight-medium q-px-sm">{{ dateLabel }}</span>

        <q-space />

        <!-- Generate Shopping -->
        <q-btn
          color="secondary"
          icon="shopping_cart"
          label="Generate Shopping"
          @click="showShoppingPreview = true"
        />
      </div>

      <!-- Loading indicator -->
      <q-linear-progress v-if="mealPlan.loading.value" indeterminate color="primary" class="q-mb-sm" />

      <!-- Empty state -->
      <div
        v-if="!mealPlan.loading.value && mealPlan.entries.value.length === 0"
        class="empty-state column items-center justify-center q-py-xl text-grey-6"
      >
        <q-icon name="event" size="4rem" class="q-mb-md" />
        <div class="text-h6">No meals scheduled yet</div>
        <div class="text-body2 q-mt-sm">Click a day to add one</div>
      </div>

      <!-- Month view -->
      <QCalendarMonth
        v-if="calendarView === 'month'"
        v-model="selectedDate"
        no-outside-days
        class="meal-calendar"
        @change="onCalendarChange"
        @click:day="onDayClick"
      >
        <template #day="{ scope }">
          <div class="day-entries">
            <div
              v-for="entry in entriesForDate(scope.timestamp.date)"
              :key="entry._id"
              class="meal-chip row items-center q-mb-xs"
              :class="{ 'is-leftover': !entry.cookDate || entry.cookDate.slice(0, 10) !== scope.timestamp.date }"
              @click.stop="openEditEntry(entry)"
            >
              <span v-if="entry.recipeName" class="meal-icon q-mr-xs">🍽️</span>
              <span class="meal-name">{{ truncate(entry.recipeName) }}</span>
              <span v-if="entry.servings" class="meal-servings q-ml-xs text-caption">×{{ entry.servings }}</span>
            </div>
          </div>
        </template>
      </QCalendarMonth>

      <!-- Week / Agenda view -->
      <QCalendarAgenda
        v-else
        v-model="selectedDate"
        :view="calendarView === 'week' ? 'week' : 'day'"
        class="meal-calendar"
        @change="onCalendarChange"
        @click:day="onDayClick"
      >
        <template #day="{ scope }">
          <div class="agenda-day-entries q-pa-xs">
            <div
              v-for="entry in entriesForDate(scope.timestamp.date)"
              :key="entry._id"
              class="agenda-meal-row row items-center q-mb-xs q-pa-xs rounded-borders"
              :class="{ 'is-leftover': !entry.cookDate || entry.cookDate.slice(0, 10) !== scope.timestamp.date }"
              @click.stop="openEditEntry(entry)"
            >
              <span class="q-mr-sm">🍽️</span>
              <div class="col">
                <div class="text-weight-medium">{{ entry.recipeName }}</div>
                <div v-if="(entry.mealTypes && entry.mealTypes.length) || entry.servings" class="text-caption text-grey-7">
                  <span v-if="entry.mealTypes && entry.mealTypes.length">{{ entry.mealTypes.join(' · ') }}</span>
                  <span v-if="entry.mealTypes && entry.mealTypes.length && entry.servings"> · </span>
                  <span v-if="entry.servings">{{ entry.servings }} servings</span>
                </div>
              </div>
              <q-badge v-if="entry.cookDate && entry.cookDate.slice(0, 10) !== scope.timestamp.date" color="orange" label="leftover" />
            </div>
            <div
              v-if="entriesForDate(scope.timestamp.date).length === 0"
              class="text-caption text-grey-5 q-pa-xs"
            >
              No meals
            </div>
          </div>
        </template>
      </QCalendarAgenda>

      <!-- FAB: add entry -->
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
          fab
          icon="add"
          color="primary"
          @click="openAddEntry(selectedDate)"
        >
          <q-tooltip>Add meal</q-tooltip>
        </q-btn>
      </q-page-sticky>

      <!-- Entry dialog -->
      <MealPlanEntryDialog
        v-model="showEntryDialog"
        :mode="entryDialogMode"
        :initial-data="entryInitialData"
        :default-cook-date="entryDefaultCookDate"
        @save="handleEntrySave"
        @delete="handleEntryDelete"
      />

      <!-- Shopping preview dialog -->
      <ShoppingPreviewDialog
        v-model="showShoppingPreview"
        :from="shoppingFrom"
        :to="shoppingTo"
        @generated="showShoppingPreview = false"
      />
    </div>
  </PageWrapper>
</template>

<style scoped>
.meal-plan-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  flex-wrap: wrap;
}

.date-label {
  min-width: 180px;
}

.meal-calendar {
  flex: 1;
  min-height: 560px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.day-entries {
  min-height: 4px;
  padding: 2px;
}

.meal-chip {
  background-color: #e8f5e9;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.7rem;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  border-left: 3px solid #4caf50;
  transition: background-color 0.15s;
}

.meal-chip:hover {
  background-color: #c8e6c9;
}

.meal-chip.is-leftover {
  background-color: #fff3e0;
  border-left-color: #ff9800;
}

.meal-chip.is-leftover:hover {
  background-color: #ffe0b2;
}

.meal-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.agenda-meal-row {
  background-color: #e8f5e9;
  border-left: 3px solid #4caf50;
  cursor: pointer;
  transition: background-color 0.15s;
}

.agenda-meal-row:hover {
  background-color: #c8e6c9;
}

.agenda-meal-row.is-leftover {
  background-color: #fff3e0;
  border-left-color: #ff9800;
}

.agenda-meal-row.is-leftover:hover {
  background-color: #ffe0b2;
}

.empty-state {
  min-height: 300px;
}

@media (max-width: 599px) {
  .date-label {
    min-width: unset;
  }

  .meal-calendar {
    min-height: 400px;
  }
}
</style>
