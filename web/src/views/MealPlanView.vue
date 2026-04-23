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
const selectedDate = ref<string>(toISODate(new Date()))
const todayStr = computed(() => toISODate(new Date()))

// --- Header labels ---
const monthLabel = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
})

const yearLabel = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  return d.getUTCFullYear()
})

const rangeLabel = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  const dayOfWeek = d.getUTCDay()
  const weekStart = new Date(d)
  weekStart.setUTCDate(d.getUTCDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(weekStart)} – ${fmt(weekEnd)}, ${weekStart.getUTCFullYear()}`
})

// Count meals scheduled in the currently visible range
const visibleMealCount = computed(() => {
  const from = shoppingFrom.value
  const to = shoppingTo.value
  return mealPlan.entries.value.filter((e) => {
    const d = e.cookDate?.slice(0, 10)
    return d && d >= from && d <= to
  }).length
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
  selectedDate.value = toISODate(d)
}

function maybeExtendRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z')
  const from = toISODate(new Date(d.getTime() - 60 * 86400_000))
  const to = toISODate(new Date(d.getTime() + 60 * 86400_000))
  mealPlan.fetchRange(from, to)
}

function onCalendarChange(data: any) {
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

const shoppingFrom = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    d.setUTCDate(1)
    return toISODate(d)
  }
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return toISODate(d)
})

const shoppingTo = computed(() => {
  const d = new Date(shoppingFrom.value + 'T00:00:00Z')
  if (calendarView.value === 'month') {
    d.setUTCMonth(d.getUTCMonth() + 1)
    d.setUTCDate(0)
    return toISODate(d)
  }
  d.setUTCDate(d.getUTCDate() + 6)
  return toISODate(d)
})

// --- Day click ---
function onDayClick(data: any) {
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

function isLeftover(entry: MealPlanEntry, dateStr: string): boolean {
  return !!entry.cookDate && entry.cookDate.slice(0, 10) !== dateStr
}

function truncate(str: string | undefined, max = 22): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

const MEAL_TYPE_ICON: Record<string, string> = {
  breakfast: 'free_breakfast',
  lunch: 'lunch_dining',
  dinner: 'dinner_dining'
}

// Deterministic chip color per recipe for visual continuity across the grid
const CHIP_PALETTE = [
  { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' }, // blue
  { bg: '#e8f5e9', border: '#2e7d32', text: '#1b5e20' }, // green
  { bg: '#fff3e0', border: '#ef6c00', text: '#e65100' }, // orange
  { bg: '#fce4ec', border: '#c2185b', text: '#880e4f' }, // pink
  { bg: '#f3e5f5', border: '#7b1fa2', text: '#4a148c' }, // purple
  { bg: '#e0f7fa', border: '#00838f', text: '#006064' }, // cyan
  { bg: '#fffde7', border: '#f9a825', text: '#f57f17' }  // yellow
]

function chipStyle(recipeId: string | undefined, leftover: boolean) {
  const id = recipeId ?? 'x'
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const palette = CHIP_PALETTE[hash % CHIP_PALETTE.length]!
  if (leftover) {
    return {
      backgroundColor: 'transparent',
      borderLeft: `3px dashed ${palette.border}`,
      color: palette.text,
      border: `1px dashed ${palette.border}`
    }
  }
  return {
    backgroundColor: palette.bg,
    borderLeft: `3px solid ${palette.border}`,
    color: palette.text
  }
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
      <!-- Header -->
      <div class="mp-header row items-end q-mb-lg">
        <div class="col">
          <div class="mp-month text-h3 text-weight-bold">{{ monthLabel }}</div>
          <div class="mp-year text-subtitle1 text-grey-6">
            <span class="mp-year-num">{{ yearLabel }}</span>
            <span v-if="calendarView !== 'month'" class="q-ml-sm">· {{ rangeLabel }}</span>
          </div>
          <div class="mp-count text-caption text-grey-7 q-mt-xs">
            <q-icon name="restaurant_menu" size="14px" class="q-mr-xs" />
            {{ visibleMealCount }} {{ visibleMealCount === 1 ? 'meal' : 'meals' }} scheduled
          </div>
        </div>

        <!-- Generate Shopping CTA -->
        <div class="col-auto">
          <q-btn
            class="mp-generate-btn"
            color="secondary"
            icon="shopping_cart"
            label="Generate shopping"
            no-caps
            unelevated
            :ripple="{ color: 'white' }"
            @click="showShoppingPreview = true"
          />
        </div>
      </div>

      <!-- Sub-toolbar: view toggle + nav -->
      <div class="mp-subtoolbar row items-center q-mb-md">
        <!-- Pill view toggle -->
        <q-btn-toggle
          v-model="calendarView"
          :options="[
            { label: 'Month', value: 'month', icon: 'calendar_view_month' },
            { label: 'Week', value: 'week', icon: 'calendar_view_week' },
            { label: 'Agenda', value: 'agenda', icon: 'view_agenda' }
          ]"
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          unelevated
          no-caps
          dense
          class="mp-view-toggle"
        />

        <q-space />

        <!-- Nav controls -->
        <div class="row items-center q-gutter-xs">
          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            size="md"
            class="mp-nav-btn"
            @click="navigate(-1)"
          >
            <q-tooltip>Previous</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            no-caps
            label="Today"
            class="mp-today-btn"
            @click="goToday"
          />
          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            size="md"
            class="mp-nav-btn"
            @click="navigate(1)"
          >
            <q-tooltip>Next</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Loading bar -->
      <q-linear-progress
        v-if="mealPlan.loading.value"
        indeterminate
        color="primary"
        class="mp-loading"
      />

      <!-- Calendar card -->
      <div class="mp-card">
        <!-- Month view -->
        <QCalendarMonth
          v-if="calendarView === 'month'"
          v-model="selectedDate"
          no-outside-days
          :short-weekday-label="false"
          class="mp-calendar mp-calendar--month"
          @change="onCalendarChange"
          @click:day="onDayClick"
        >
          <template #day="{ scope }">
            <div
              class="mp-day"
              :class="{
                'mp-day--today': scope.timestamp.date === todayStr,
                'mp-day--weekend': scope.timestamp.weekday === 0 || scope.timestamp.weekday === 6
              }"
            >
              <div class="mp-day-entries">
                <div
                  v-for="entry in entriesForDate(scope.timestamp.date)"
                  :key="entry._id"
                  class="mp-chip"
                  :class="{ 'mp-chip--leftover': isLeftover(entry, scope.timestamp.date) }"
                  :style="chipStyle(entry.recipeId, isLeftover(entry, scope.timestamp.date))"
                  @click.stop="openEditEntry(entry)"
                >
                  <q-icon
                    v-if="entry.mealTypes && entry.mealTypes.length && MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                    :name="MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                    size="12px"
                    class="mp-chip-icon"
                  />
                  <span v-else class="mp-chip-dot">●</span>
                  <span class="mp-chip-name">{{ truncate(entry.recipeName) }}</span>
                  <span
                    v-if="entry.servings && entry.servings !== 1"
                    class="mp-chip-servings"
                  >×{{ entry.servings }}</span>
                </div>
              </div>
            </div>
          </template>
        </QCalendarMonth>

        <!-- Week / Agenda view -->
        <QCalendarAgenda
          v-else
          v-model="selectedDate"
          :view="calendarView === 'week' ? 'week' : 'day'"
          class="mp-calendar mp-calendar--agenda"
          @change="onCalendarChange"
          @click:day="onDayClick"
        >
          <template #day="{ scope }">
            <div
              class="mp-agenda-day"
              :class="{ 'mp-agenda-day--today': scope.timestamp.date === todayStr }"
            >
              <div
                v-for="entry in entriesForDate(scope.timestamp.date)"
                :key="entry._id"
                class="mp-agenda-row"
                :style="chipStyle(entry.recipeId, isLeftover(entry, scope.timestamp.date))"
                @click.stop="openEditEntry(entry)"
              >
                <div class="mp-agenda-icon">
                  <q-icon
                    v-if="entry.mealTypes && entry.mealTypes.length && MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                    :name="MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                    size="20px"
                  />
                  <q-icon v-else name="restaurant" size="20px" />
                </div>
                <div class="col">
                  <div class="mp-agenda-name text-weight-medium">{{ entry.recipeName }}</div>
                  <div
                    v-if="(entry.mealTypes && entry.mealTypes.length) || entry.servings"
                    class="mp-agenda-meta text-caption"
                  >
                    <span v-if="entry.mealTypes && entry.mealTypes.length">{{ entry.mealTypes.join(' · ') }}</span>
                    <span v-if="entry.mealTypes && entry.mealTypes.length && entry.servings"> · </span>
                    <span v-if="entry.servings">{{ entry.servings }} servings</span>
                  </div>
                </div>
                <q-badge
                  v-if="isLeftover(entry, scope.timestamp.date)"
                  outline
                  color="orange"
                  label="leftover"
                  class="q-mr-sm"
                />
              </div>
              <div
                v-if="entriesForDate(scope.timestamp.date).length === 0"
                class="mp-agenda-empty text-caption text-grey-5"
              >
                — No meals —
              </div>
            </div>
          </template>
        </QCalendarAgenda>

        <!-- Empty state overlay (only when the whole plan is empty) -->
        <Transition name="fade">
          <div
            v-if="!mealPlan.loading.value && mealPlan.entries.value.length === 0"
            class="mp-empty-overlay"
          >
            <div class="mp-empty-card">
              <q-icon name="restaurant_menu" size="56px" color="primary" class="q-mb-md" />
              <div class="text-h6 text-weight-medium">Plan your first meal</div>
              <div class="text-body2 text-grey-7 q-mt-xs">
                Click a day in the calendar or use the + button to schedule a recipe.
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- FAB: add entry -->
      <q-page-sticky position="bottom-right" :offset="[24, 24]">
        <q-btn
          fab
          icon="add"
          color="primary"
          class="mp-fab"
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
  gap: 0;
}

/* -------- Header -------- */
.mp-header {
  padding: 0 4px;
}

.mp-month {
  letter-spacing: -0.02em;
  line-height: 1;
  color: #1a1a2e;
}

.mp-year-num {
  font-weight: 600;
  color: #7b8794;
  letter-spacing: 0.02em;
}

.mp-count {
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #7b8794;
}

.mp-generate-btn {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
  transition: transform 0.15s, box-shadow 0.15s;
}

.mp-generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
}

/* -------- Sub-toolbar -------- */
.mp-subtoolbar {
  padding: 8px 4px;
}

.mp-view-toggle {
  background-color: #f1f3f5;
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
}

.mp-view-toggle :deep(.q-btn) {
  border-radius: 7px;
  padding: 6px 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  min-height: 32px;
}

.mp-view-toggle :deep(.q-btn--active) {
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
}

.mp-nav-btn {
  color: #495057;
  border-radius: 8px;
}

.mp-nav-btn:hover {
  background-color: #f1f3f5;
}

.mp-today-btn {
  color: #1976d2;
  border: 1px solid #bdd7f0;
  border-radius: 8px;
  padding: 4px 12px;
  font-weight: 600;
  min-height: 32px;
}

.mp-today-btn:hover {
  background-color: #e3f2fd;
}

/* -------- Loading bar -------- */
.mp-loading {
  border-radius: 2px;
  margin-bottom: 8px;
  height: 3px;
}

/* -------- Calendar card -------- */
.mp-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  min-height: 640px;
}

.mp-calendar {
  border: none;
  border-radius: 16px;
}

/* Override QCalendar internals */
.mp-calendar :deep(.q-calendar-month__head) {
  background-color: #fafbfc;
  border-bottom: 1px solid #e9ecef;
}

.mp-calendar :deep(.q-calendar-month__head-weekday) {
  padding: 14px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6c757d;
}

/* Kill QCalendar's rainbow default day-number coloring */
.mp-calendar :deep(.q-calendar-month__day-label__wrapper),
.mp-calendar :deep(.q-calendar-month__day-label) {
  color: #1a1a2e !important;
}

.mp-calendar :deep(.q-calendar-month__day-label) {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Day cell container */
.mp-calendar :deep(.q-calendar-month__day) {
  transition: background-color 0.12s;
  cursor: pointer;
  min-height: 120px;
}

.mp-calendar :deep(.q-calendar-month__day:hover) {
  background-color: rgba(25, 118, 210, 0.04);
}

/* Today indicator */
.mp-day--today :deep(.q-calendar-month__day-label),
.mp-calendar :deep(.q-current-day .q-calendar-month__day-label),
.mp-calendar :deep(.q-active-date .q-calendar-month__day-label) {
  position: relative;
  z-index: 1;
}

.mp-calendar :deep(.q-current-day)::before {
  content: '';
  position: absolute;
  top: 6px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
  z-index: 0;
  pointer-events: none;
}

.mp-calendar :deep(.q-current-day .q-calendar-month__day-label) {
  color: #fff !important;
  font-weight: 700;
}

/* Weekend soft tint */
.mp-day--weekend {
  background-color: rgba(99, 102, 241, 0.025);
}

/* Day cell contents */
.mp-day {
  width: 100%;
  min-height: 96px;
  padding: 4px 6px 6px;
}

.mp-day-entries {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

/* Meal chips */
.mp-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 3px 6px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition: transform 0.1s, box-shadow 0.1s;
  line-height: 1.2;
}

.mp-chip:hover {
  transform: translateX(1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.mp-chip-icon {
  flex-shrink: 0;
}

.mp-chip-dot {
  font-size: 0.45rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.mp-chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.mp-chip-servings {
  font-size: 0.65rem;
  opacity: 0.75;
  font-weight: 700;
  padding-left: 2px;
}

.mp-chip--leftover {
  font-style: italic;
}

/* -------- Agenda / week view -------- */
.mp-calendar--agenda :deep(.q-calendar-agenda__head) {
  background-color: #fafbfc;
  border-bottom: 1px solid #e9ecef;
}

.mp-agenda-day {
  padding: 8px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mp-agenda-day--today {
  background: linear-gradient(180deg, rgba(25, 118, 210, 0.04) 0%, transparent 100%);
}

.mp-agenda-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.mp-agenda-row:hover {
  transform: translateX(2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.mp-agenda-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mp-agenda-name {
  font-size: 0.95rem;
  line-height: 1.2;
}

.mp-agenda-meta {
  margin-top: 2px;
  opacity: 0.85;
}

.mp-agenda-empty {
  text-align: center;
  padding: 20px 0;
  font-style: italic;
}

/* -------- Empty state overlay -------- */
.mp-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 60%, transparent 100%);
  pointer-events: none;
  z-index: 5;
}

.mp-empty-card {
  text-align: center;
  padding: 32px 48px;
  max-width: 420px;
  pointer-events: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* -------- FAB -------- */
.mp-fab {
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.4);
  transition: transform 0.15s;
}

.mp-fab:hover {
  transform: scale(1.05);
}

/* -------- Responsive -------- */
@media (max-width: 768px) {
  .mp-month {
    font-size: 2rem !important;
  }

  .mp-calendar :deep(.q-calendar-month__day) {
    min-height: 80px;
  }

  .mp-day {
    min-height: 64px;
    padding: 2px 3px;
  }

  .mp-chip {
    font-size: 0.62rem;
    padding: 2px 4px;
  }

  .mp-chip-name {
    max-width: 80px;
  }

  .mp-generate-btn :deep(.q-btn__content) > :nth-child(3) {
    display: none;
  }
}

@media (max-width: 480px) {
  .mp-subtoolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .mp-view-toggle {
    align-self: stretch;
  }

  .mp-view-toggle :deep(.q-btn) {
    flex: 1;
  }
}
</style>
