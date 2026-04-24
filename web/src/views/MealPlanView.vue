<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
import PageHeader from '@/components/common/PageHeader.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import MealPlanEntryDialog from '@/components/MealPlanEntryDialog.vue'
import ShoppingPreviewDialog from '@/components/ShoppingPreviewDialog.vue'

const mealPlan = useMealPlan()
const recipesStore = useRecipesStore()

// --- Calendar state ---
type CalendarView = 'month' | 'week' | 'agenda'
const calendarView = ref<CalendarView>('month')
const selectedDate = ref<string>(toISODate(new Date()))
const todayStr = computed(() => toISODate(new Date()))

// Week starts Monday: [1,2,3,4,5,6,0] (Quasar uses 0=Sunday).
const weekdaysMondayFirst = [1, 2, 3, 4, 5, 6, 0]

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

const headerSubtitle = computed(() => {
  const count = visibleMealCount.value
  const label = calendarView.value === 'month'
    ? `${monthLabel.value} ${yearLabel.value}`
    : rangeLabel.value
  return `${count} ${count === 1 ? 'meal' : 'meals'} scheduled · ${label}`
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
const entryDefaultEatDates = ref<string[] | undefined>(undefined)

function openAddEntry(cookDate?: string, eatDates?: string[]) {
  entryDialogMode.value = 'add'
  entryInitialData.value = undefined
  entryDefaultCookDate.value = cookDate ?? selectedDate.value
  entryDefaultEatDates.value = eatDates
  showEntryDialog.value = true
}

function openEditEntry(entry: MealPlanEntry) {
  entryDialogMode.value = 'edit'
  entryInitialData.value = entry
  entryDefaultCookDate.value = undefined
  entryDefaultEatDates.value = undefined
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

// --- Day click / drag-select ---
// A single click on a day and a drag across days share one gesture:
// pointerdown seeds the range, pointerenter extends it while the button is
// held, pointerup finalises it and opens the Add Meal dialog with
// cookDate = first selected day, eatDates = every day in the range.
const dragStart = ref<string | null>(null)
const dragEnd = ref<string | null>(null)
const isDragging = ref(false)

const dragRange = computed<string[]>(() => {
  if (!dragStart.value || !dragEnd.value) return []
  const [a, b] = dragStart.value <= dragEnd.value
    ? [dragStart.value, dragEnd.value]
    : [dragEnd.value, dragStart.value]
  return [a, b]
})

const dragSelectedDates = computed<string[]>(() => {
  const [a, b] = dragRange.value
  if (!a || !b) return []
  const out: string[] = []
  const cur = new Date(a + 'T00:00:00Z')
  const end = new Date(b + 'T00:00:00Z')
  while (cur <= end) {
    out.push(toISODate(cur))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
})

function onDayPointerDown(dateStr: string, event: PointerEvent) {
  // Only primary button / touch / pen strokes start a selection.
  if (event.button !== undefined && event.button !== 0) return
  isDragging.value = true
  dragStart.value = dateStr
  dragEnd.value = dateStr
}

function onDayPointerEnter(dateStr: string) {
  if (!isDragging.value) return
  dragEnd.value = dateStr
}

function finalizeDrag() {
  if (!isDragging.value) return
  const dates = dragSelectedDates.value
  isDragging.value = false
  dragStart.value = null
  dragEnd.value = null
  if (dates.length === 0) return
  selectedDate.value = dates[0]!
  openAddEntry(dates[0], dates.length > 1 ? dates : undefined)
}

function cancelDrag() {
  isDragging.value = false
  dragStart.value = null
  dragEnd.value = null
}

onMounted(() => {
  window.addEventListener('pointerup', finalizeDrag)
  window.addEventListener('pointercancel', cancelDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', finalizeDrag)
  window.removeEventListener('pointercancel', cancelDrag)
})

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
  <q-page>
    <PageWrapper max-width="1400px">
      <div class="sp-mp">
        <!-- Page header with meal count subtitle -->
        <PageHeader title="Meal Plan" icon="event" :subtitle="headerSubtitle">
          <template #actions>
            <!-- Desktop "Generate shopping" CTA -->
            <q-btn
              class="gt-sm sp-mp__generate-btn"
              color="secondary"
              icon="shopping_cart"
              label="Generate shopping"
              no-caps
              unelevated
              @click="showShoppingPreview = true"
            />
          </template>
        </PageHeader>

        <!-- Sub-toolbar: view toggle + nav -->
        <div class="sp-mp__subtoolbar row items-center q-mb-md">
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
            class="sp-mp__view-toggle"
          />

          <q-space />

          <!-- Period nav -->
          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              dense
              round
              icon="chevron_left"
              size="md"
              class="sp-mp__nav-btn"
              @click="navigate(-1)"
            >
              <q-tooltip>Previous</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              no-caps
              label="Today"
              class="sp-mp__today-btn"
              @click="goToday"
            />
            <q-btn
              flat
              dense
              round
              icon="chevron_right"
              size="md"
              class="sp-mp__nav-btn"
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
          class="sp-mp__loading"
        />

        <!-- Calendar wrapped in a SectionCard for visual structure -->
        <SectionCard flat class="sp-mp__calendar-card">
          <!-- Month view -->
          <QCalendarMonth
            v-if="calendarView === 'month'"
            v-model="selectedDate"
            no-outside-days
            :short-weekday-label="false"
            :weekdays="weekdaysMondayFirst"
            :selected-start-end-dates="dragRange"
            class="sp-mp__calendar sp-mp__calendar--month"
            @change="onCalendarChange"
          >
            <template #day="{ scope }">
              <div
                class="sp-mp__day"
                :class="{ 'sp-mp__day--today': scope.timestamp.date === todayStr }"
                @pointerdown="onDayPointerDown(scope.timestamp.date, $event)"
                @pointerenter="onDayPointerEnter(scope.timestamp.date)"
              >
                <div class="sp-mp__day-entries">
                  <div
                    v-for="entry in entriesForDate(scope.timestamp.date)"
                    :key="entry._id"
                    class="sp-mp__chip"
                    :class="{ 'sp-mp__chip--leftover': isLeftover(entry, scope.timestamp.date) }"
                    :style="chipStyle(entry.recipeId, isLeftover(entry, scope.timestamp.date))"
                    @pointerdown.stop
                    @click.stop="openEditEntry(entry)"
                  >
                    <q-icon
                      v-if="entry.mealTypes && entry.mealTypes.length && MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                      :name="MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                      size="12px"
                      class="sp-mp__chip-icon"
                    />
                    <span v-else class="sp-mp__chip-dot">●</span>
                    <span class="sp-mp__chip-name">{{ truncate(entry.recipeName) }}</span>
                    <span
                      v-if="entry.servings && entry.servings !== 1"
                      class="sp-mp__chip-servings"
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
            :weekdays="weekdaysMondayFirst"
            class="sp-mp__calendar sp-mp__calendar--agenda"
            @change="onCalendarChange"
          >
            <template #day="{ scope }">
              <div
                class="sp-mp__agenda-day"
                :class="{ 'sp-mp__agenda-day--today': scope.timestamp.date === todayStr }"
                @pointerdown="onDayPointerDown(scope.timestamp.date, $event)"
                @pointerenter="onDayPointerEnter(scope.timestamp.date)"
              >
                <div
                  v-for="entry in entriesForDate(scope.timestamp.date)"
                  :key="entry._id"
                  class="sp-mp__agenda-row"
                  :style="chipStyle(entry.recipeId, isLeftover(entry, scope.timestamp.date))"
                  @pointerdown.stop
                  @click.stop="openEditEntry(entry)"
                >
                  <div class="sp-mp__agenda-icon">
                    <q-icon
                      v-if="entry.mealTypes && entry.mealTypes.length && MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                      :name="MEAL_TYPE_ICON[entry.mealTypes[0]!]"
                      size="20px"
                    />
                    <q-icon v-else name="restaurant" size="20px" />
                  </div>
                  <div class="col">
                    <div class="sp-mp__agenda-name text-weight-medium">{{ entry.recipeName }}</div>
                    <div
                      v-if="(entry.mealTypes && entry.mealTypes.length) || entry.servings"
                      class="sp-mp__agenda-meta text-caption"
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
                  class="sp-mp__agenda-empty text-caption text-grey-5"
                >
                  — No meals —
                </div>
              </div>
            </template>
          </QCalendarAgenda>

          <!-- Empty state overlay (only when the whole plan is empty) -->
          <Transition name="sp-fade">
            <div
              v-if="!mealPlan.loading.value && mealPlan.entries.value.length === 0"
              class="sp-mp__empty-overlay"
            >
              <div class="sp-mp__empty-card">
                <q-icon name="restaurant_menu" size="56px" color="primary" class="q-mb-md" />
                <div class="text-h6 text-weight-medium" style="color: var(--sp-text)">Plan your first meal</div>
                <div class="text-body2 q-mt-xs" style="color: var(--sp-text-muted)">
                  Click a day in the calendar or use the + button to schedule a recipe.
                </div>
              </div>
            </div>
          </Transition>
        </SectionCard>

        <!-- FAB: add entry -->
        <q-page-sticky position="bottom-right" :offset="[24, 24]">
          <q-btn
            fab
            icon="add"
            color="primary"
            class="sp-mp__fab"
            @click="openAddEntry(selectedDate)"
          >
            <q-tooltip>Add meal</q-tooltip>
          </q-btn>
        </q-page-sticky>

        <!-- "Generate shopping" sticky button on mobile (amber, above bottom nav) -->
        <q-btn
          class="lt-md sp-mp__generate-btn-mobile"
          color="secondary"
          icon="shopping_cart"
          label="Generate shopping"
          no-caps
          unelevated
          @click="showShoppingPreview = true"
        />

        <!-- Entry dialog -->
        <MealPlanEntryDialog
          v-model="showEntryDialog"
          :mode="entryDialogMode"
          :initial-data="entryInitialData"
          :default-cook-date="entryDefaultCookDate"
          :default-eat-dates="entryDefaultEatDates"
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
  </q-page>
</template>

<style scoped>
.sp-mp {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* -------- Desktop "Generate shopping" CTA -------- */
.sp-mp__generate-btn {
  border-radius: var(--sp-r-md);
  padding: 10px 18px;
  font-weight: 600;
  transition: transform 0.15s, box-shadow 0.15s;
}

.sp-mp__generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--sp-shadow-2);
}

/* -------- Mobile sticky "Generate shopping" button -------- */
.sp-mp__generate-btn-mobile {
  position: fixed;
  bottom: calc(var(--sp-bottom-nav-h, 56px) + 16px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  z-index: 1000;
  border-radius: var(--sp-r-md);
  font-weight: 600;
  box-shadow: var(--sp-shadow-2);
}

/* -------- Sub-toolbar -------- */
.sp-mp__subtoolbar {
  padding: 0 2px 4px;
}

.sp-mp__view-toggle {
  background-color: var(--sp-surface-2);
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
  border: 1px solid var(--sp-border);
}

.sp-mp__view-toggle :deep(.q-btn) {
  border-radius: 7px;
  padding: 6px 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  min-height: 32px;
}

.sp-mp__view-toggle :deep(.q-btn--active) {
  box-shadow: var(--sp-shadow-1);
}

.sp-mp__nav-btn {
  color: var(--sp-text-muted);
  border-radius: 8px;
}

.sp-mp__nav-btn:hover {
  background-color: var(--sp-surface-2);
}

.sp-mp__today-btn {
  color: var(--sp-primary);
  border: 1px solid var(--sp-border);
  border-radius: 8px;
  padding: 4px 12px;
  font-weight: 600;
  min-height: 32px;
}

.sp-mp__today-btn:hover {
  background-color: var(--sp-primary-soft);
}

/* -------- Loading bar -------- */
.sp-mp__loading {
  border-radius: 2px;
  margin-bottom: 8px;
  height: 3px;
}

/* -------- Calendar card -------- */
.sp-mp__calendar-card {
  position: relative;
  /* SectionCard adds border + border-radius already; override padding for the calendar */
  padding: 0 !important;
  overflow: hidden;
  min-height: 640px;
}

/* Remove SectionCard body padding so the calendar fills edge-to-edge */
.sp-mp__calendar-card :deep(.sp-section-card__body) {
  padding: 0;
}

.sp-mp__calendar {
  border: none;
}

/* Override QCalendar internals to match design system */
.sp-mp__calendar :deep(.q-calendar-month__head) {
  background-color: var(--sp-surface-2);
  border-bottom: 1px solid var(--sp-border);
}

.sp-mp__calendar :deep(.q-calendar-month__head-weekday) {
  padding: 14px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}

/* Kill QCalendar's rainbow default day-number coloring */
.sp-mp__calendar :deep(.q-calendar-month__day-label__wrapper),
.sp-mp__calendar :deep(.q-calendar-month__day-label) {
  color: var(--sp-text) !important;
}

.sp-mp__calendar :deep(.q-calendar-month__day-label) {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Day cell container */
.sp-mp__calendar :deep(.q-calendar-month__day) {
  transition: background-color 0.12s;
  cursor: pointer;
  min-height: 120px;
}

.sp-mp__calendar :deep(.q-calendar-month__day:hover) {
  background-color: var(--sp-primary-soft);
}

/* Today highlight */
.sp-mp__calendar :deep(.q-current-day)::before {
  content: '';
  position: absolute;
  top: 6px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sp-primary);
  z-index: 0;
  pointer-events: none;
}

.sp-mp__calendar :deep(.q-current-day .q-calendar-month__day-label) {
  color: #fff !important;
  font-weight: 700;
}

/* Day cell contents */
.sp-mp__day {
  width: 100%;
  min-height: 96px;
  padding: 4px 6px 6px;
  /* Drag-select: keep touch gestures from scrolling the page mid-drag. */
  touch-action: none;
  user-select: none;
}

.sp-mp__day-entries {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

/* Meal chips */
.sp-mp__chip {
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

.sp-mp__chip:hover {
  transform: translateX(1px);
  box-shadow: var(--sp-shadow-1);
}

.sp-mp__chip-icon {
  flex-shrink: 0;
}

.sp-mp__chip-dot {
  font-size: 0.45rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.sp-mp__chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.sp-mp__chip-servings {
  font-size: 0.65rem;
  opacity: 0.75;
  font-weight: 700;
  padding-left: 2px;
}

.sp-mp__chip--leftover {
  font-style: italic;
}

/* -------- Agenda / week view -------- */
.sp-mp__calendar--agenda :deep(.q-calendar-agenda__head) {
  background-color: var(--sp-surface-2);
  border-bottom: 1px solid var(--sp-border);
}

.sp-mp__agenda-day {
  padding: 8px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-mp__agenda-day--today {
  background: linear-gradient(180deg, var(--sp-primary-soft) 0%, transparent 100%);
}

.sp-mp__agenda-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--sp-r-md);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.sp-mp__agenda-row:hover {
  transform: translateX(2px);
  box-shadow: var(--sp-shadow-1);
}

.sp-mp__agenda-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sp-mp__agenda-name {
  font-size: 0.95rem;
  line-height: 1.2;
  color: var(--sp-text);
}

.sp-mp__agenda-meta {
  margin-top: 2px;
  opacity: 0.85;
  color: var(--sp-text-muted);
}

.sp-mp__agenda-empty {
  text-align: center;
  padding: 20px 0;
  font-style: italic;
}

/* -------- Empty state overlay -------- */
.sp-mp__empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 60%, transparent 100%);
  pointer-events: none;
  z-index: 5;
}

.sp-mp__empty-card {
  text-align: center;
  padding: 32px 48px;
  max-width: 420px;
  pointer-events: auto;
}

.sp-fade-enter-active, .sp-fade-leave-active {
  transition: opacity 0.25s;
}
.sp-fade-enter-from, .sp-fade-leave-to {
  opacity: 0;
}

/* -------- FAB -------- */
.sp-mp__fab {
  box-shadow: 0 8px 24px rgba(47, 125, 95, 0.35);
  transition: transform 0.15s;
}

.sp-mp__fab:hover {
  transform: scale(1.05);
}

/* -------- Responsive -------- */
@media (max-width: 768px) {
  .sp-mp__calendar :deep(.q-calendar-month__day) {
    min-height: 80px;
  }

  .sp-mp__day {
    min-height: 64px;
    padding: 2px 3px;
  }

  .sp-mp__chip {
    font-size: 0.62rem;
    padding: 2px 4px;
  }

  .sp-mp__chip-name {
    max-width: 80px;
  }
}

@media (max-width: 480px) {
  .sp-mp__subtoolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .sp-mp__view-toggle {
    align-self: stretch;
  }

  .sp-mp__view-toggle :deep(.q-btn) {
    flex: 1;
  }
}
</style>
