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
import FabAdd from '@/components/common/FabAdd.vue'

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
// A single click opens the Add dialog for that day; a horizontal drag across
// days picks a range. A vertical drag must scroll the page instead — phones
// have no other way to scroll the calendar, so we disambiguate by the
// dominant axis of the first few pixels of movement before committing to a
// drag-select. Mouse (`pointerType === 'mouse'`) skips the gate since the
// page doesn't scroll under a mouse drag.
const dragStart = ref<string | null>(null)
const dragEnd = ref<string | null>(null)
const isDragging = ref(false)
// Pre-drag arming state: we record the pointerdown position and only flip
// `isDragging` to true once the pointer has moved enough horizontally to
// clearly be a range-select rather than a scroll.
const armedDate = ref<string | null>(null)
const armedX = ref(0)
const armedY = ref(0)
const armedPointerType = ref<string>('mouse')
const DRAG_AXIS_THRESHOLD = 8 // px before we commit to horizontal vs vertical

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
  armedDate.value = dateStr
  armedX.value = event.clientX
  armedY.value = event.clientY
  armedPointerType.value = event.pointerType || 'mouse'
  // Mouse: commit immediately — page won't scroll under a mouse drag.
  if (armedPointerType.value === 'mouse') {
    isDragging.value = true
    dragStart.value = dateStr
    dragEnd.value = dateStr
  }
}

function onDayPointerMove(event: PointerEvent) {
  // Already committed — extending happens via pointerenter on neighbour cells.
  if (isDragging.value) return
  if (!armedDate.value) return
  const dx = Math.abs(event.clientX - armedX.value)
  const dy = Math.abs(event.clientY - armedY.value)
  if (dx < DRAG_AXIS_THRESHOLD && dy < DRAG_AXIS_THRESHOLD) return
  if (dy > dx) {
    // Vertical-dominant: user is scrolling. Abort the gesture entirely so a
    // subsequent pointerup just acts as a normal scroll release (no dialog).
    armedDate.value = null
    return
  }
  // Horizontal-dominant: commit to range-select.
  isDragging.value = true
  dragStart.value = armedDate.value
  dragEnd.value = armedDate.value
}

function onDayPointerEnter(dateStr: string) {
  if (!isDragging.value) return
  dragEnd.value = dateStr
}

function finalizeDrag(event?: PointerEvent) {
  // Tap (no axis-commit yet) → open Add dialog for the armed day.
  if (!isDragging.value && armedDate.value) {
    const tapDate = armedDate.value
    armedDate.value = null
    // Don't fire the dialog if the tap landed on an interactive child (chip,
    // "+N more"). Those handlers stop propagation, so we'd never get here in
    // that case — but guard anyway.
    if (event && (event.target as HTMLElement | null)?.closest('.sp-mp__chip, .sp-mp__more')) return
    selectedDate.value = tapDate
    openAddEntry(tapDate)
    return
  }
  if (!isDragging.value) {
    armedDate.value = null
    return
  }
  const dates = dragSelectedDates.value
  isDragging.value = false
  dragStart.value = null
  dragEnd.value = null
  armedDate.value = null
  if (dates.length === 0) return
  selectedDate.value = dates[0]!
  openAddEntry(dates[0], dates.length > 1 ? dates : undefined)
}

function cancelDrag() {
  isDragging.value = false
  dragStart.value = null
  dragEnd.value = null
  armedDate.value = null
}

onMounted(() => {
  window.addEventListener('pointerup', finalizeDrag)
  window.addEventListener('pointermove', onDayPointerMove)
  window.addEventListener('pointercancel', cancelDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', finalizeDrag)
  window.removeEventListener('pointermove', onDayPointerMove)
  window.removeEventListener('pointercancel', cancelDrag)
})

// --- Render helpers ---
function entriesForDate(dateStr: string): MealPlanEntry[] {
  return mealPlan.entriesExpandedByEatDate.value[dateStr] ?? []
}

// Days (with their meals) that fall inside the currently-visible range.
// Drives the agenda list view, which is grouped by date instead of showing a
// single QCalendar day cell.
const agendaDays = computed<{ date: string; entries: MealPlanEntry[] }[]>(() => {
  const from = shoppingFrom.value
  const to = shoppingTo.value
  const out: { date: string; entries: MealPlanEntry[] }[] = []
  const cur = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')
  while (cur <= end) {
    const date = toISODate(cur)
    const entries = entriesForDate(date)
    if (entries.length > 0) out.push({ date, entries })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
})

function formatAgendaHeading(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const today = todayStr.value
  const tomorrow = toISODate(new Date(new Date(today + 'T00:00:00Z').getTime() + 86400_000))
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  if (dateStr === today) return `Today · ${monthDay}`
  if (dateStr === tomorrow) return `Tomorrow · ${monthDay}`
  return `${weekday} · ${monthDay}`
}

function isLeftover(entry: MealPlanEntry, dateStr: string): boolean {
  return !!entry.cookDate && entry.cookDate.slice(0, 10) !== dateStr
}

// Cap how many chips a single day cell renders before collapsing the rest into
// a "+N more" pill. Clicking the pill drops into agenda view for that day so
// every entry is reachable.
const MAX_VISIBLE_CHIPS = 3

function visibleEntries(dateStr: string): MealPlanEntry[] {
  return entriesForDate(dateStr).slice(0, MAX_VISIBLE_CHIPS)
}

function overflowCount(dateStr: string): number {
  return Math.max(0, entriesForDate(dateStr).length - MAX_VISIBLE_CHIPS)
}

function showAllForDay(dateStr: string) {
  selectedDate.value = dateStr
  calendarView.value = 'agenda'
}

const MEAL_TYPE_ICON: Record<string, string> = {
  breakfast: 'free_breakfast',
  lunch: 'lunch_dining',
  dinner: 'dinner_dining'
}

// Deterministic chip color per recipe — warm neutrals that complement slate + saffron
const CHIP_PALETTE = [
  { bg: '#FEEBC8', border: '#DD6B20', text: '#7B341E' }, // saffron
  { bg: '#E2E8F0', border: '#4A5568', text: '#1A202C' }, // slate
  { bg: '#FED7D7', border: '#C53030', text: '#822727' }, // brick
  { bg: '#C6F6D5', border: '#2F855A', text: '#22543D' }, // moss
  { bg: '#BEE3F8', border: '#2B6CB0', text: '#1A365D' }, // ink blue
  { bg: '#E9D8FD', border: '#6B46C1', text: '#44337A' }, // plum
  { bg: '#FEFCBF', border: '#B7791F', text: '#744210' }  // mustard
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
                    v-for="entry in visibleEntries(scope.timestamp.date)"
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
                      size="14px"
                      class="sp-mp__chip-icon"
                    />
                    <span v-else class="sp-mp__chip-dot">●</span>
                    <span class="sp-mp__chip-name">{{ entry.recipeName }}</span>
                    <span
                      v-if="entry.servings && entry.servings !== 1"
                      class="sp-mp__chip-servings"
                    >×{{ entry.servings }}</span>
                  </div>
                  <button
                    v-if="overflowCount(scope.timestamp.date) > 0"
                    class="sp-mp__more"
                    type="button"
                    @pointerdown.stop
                    @click.stop="showAllForDay(scope.timestamp.date)"
                  >
                    +{{ overflowCount(scope.timestamp.date) }} more
                  </button>
                </div>
              </div>
            </template>
          </QCalendarMonth>

          <!-- Week view: 7-column day strip -->
          <QCalendarAgenda
            v-else-if="calendarView === 'week'"
            v-model="selectedDate"
            view="week"
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

          <!-- Agenda view: flat list of every day in the range that has meals.
               QCalendar's agenda mode only shows one day at a time, so a meal
               scheduled mid-week was invisible from agenda view. This list
               groups by date and skips empty days. -->
          <div v-else class="sp-mp__agenda-list">
            <template v-if="agendaDays.length > 0">
              <section
                v-for="day in agendaDays"
                :key="day.date"
                class="sp-mp__agenda-section"
                :class="{ 'sp-mp__agenda-section--today': day.date === todayStr }"
              >
                <header class="sp-mp__agenda-section-head">
                  <span class="sp-mp__agenda-section-title">{{ formatAgendaHeading(day.date) }}</span>
                  <span class="sp-mp__agenda-section-count">
                    {{ day.entries.length }} {{ day.entries.length === 1 ? 'meal' : 'meals' }}
                  </span>
                </header>
                <div
                  v-for="entry in day.entries"
                  :key="entry._id"
                  class="sp-mp__agenda-row"
                  :style="chipStyle(entry.recipeId, isLeftover(entry, day.date))"
                  @click="openEditEntry(entry)"
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
                    v-if="isLeftover(entry, day.date)"
                    outline
                    color="orange"
                    label="leftover"
                    class="q-mr-sm"
                  />
                </div>
              </section>
            </template>
            <div v-else class="sp-mp__agenda-empty text-caption text-grey-5">
              — No meals scheduled in this range —
            </div>
          </div>

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

        <!-- FAB: add entry (mobile only, shared component to match the rest of the app) -->
        <FabAdd
          class="lt-md"
          aria-label="Add meal"
          @click="openAddEntry(selectedDate)"
        />

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

/* -------- Mobile sticky "Generate shopping" button --------
   Sits *above* the FAB (which is at `bottom: nav + 16px`, ~56px tall).
   Higher z-index than the bottom nav but lower than the FAB so the FAB stays
   the primary action. */
.sp-mp__generate-btn-mobile {
  position: fixed;
  bottom: calc(var(--sp-bottom-nav-h, 56px) + 16px + 56px + 12px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  z-index: 1900;
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
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  border: 1px solid var(--sp-border);
}

.sp-mp__view-toggle :deep(.q-btn) {
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  min-height: 26px;
}

.sp-mp__view-toggle :deep(.q-btn .q-icon) {
  font-size: 0.95rem;
}

.sp-mp__view-toggle :deep(.q-btn__content > * + *) {
  margin-left: 4px;
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
  padding: 0 !important;
  overflow: hidden;
  min-height: 640px;
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  box-shadow: var(--sp-shadow-1);
}

.sp-mp__calendar-card :deep(.sp-section-card__body) {
  padding: 0;
}

.sp-mp__calendar {
  border: none;
  background: var(--sp-surface);
}

/* Kill QCalendar's default backgrounds and borders so we can restyle from scratch */
.sp-mp__calendar :deep(.q-calendar-month__week),
.sp-mp__calendar :deep(.q-calendar-month__head--weekdays),
.sp-mp__calendar :deep(.q-calendar-agenda__day-container),
.sp-mp__calendar :deep(.q-calendar__scroll-area) {
  background: var(--sp-surface);
}

/* Weekday header */
.sp-mp__calendar :deep(.q-calendar-month__head),
.sp-mp__calendar :deep(.q-calendar-agenda__head) {
  background-color: var(--sp-primary);
  color: #fff;
  border-bottom: 1px solid var(--sp-primary-dark);
}

.sp-mp__calendar :deep(.q-calendar-month__head-weekday),
.sp-mp__calendar :deep(.q-calendar-agenda__head-weekday-label) {
  padding: 14px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
}

.sp-mp__calendar :deep(.q-calendar-month__head-weekday.q-disabled-day),
.sp-mp__calendar :deep(.q-calendar-month__head-weekday-label.q-disabled-day) {
  color: rgba(255, 255, 255, 0.5);
}

/* Day-number coloring + alignment */
.sp-mp__calendar :deep(.q-calendar-month__day-label__wrapper),
.sp-mp__calendar :deep(.q-calendar-month__day-label) {
  color: var(--sp-text) !important;
}

.sp-mp__calendar :deep(.q-calendar-month__day-label) {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 6px 8px 0;
}

/* Day cell */
.sp-mp__calendar :deep(.q-calendar-month__day) {
  transition: background-color 0.12s;
  cursor: pointer;
  min-height: 148px;
  border-right: 1px solid var(--sp-divider);
  border-bottom: 1px solid var(--sp-divider);
  background: var(--sp-surface);
}

.sp-mp__calendar :deep(.q-calendar-month__day:last-child) {
  border-right: none;
}

.sp-mp__calendar :deep(.q-calendar-month__day:hover) {
  background-color: var(--sp-primary-soft);
}

.sp-mp__calendar :deep(.q-calendar-month__day:hover .sp-mp__day::after) {
  opacity: 1;
}

/* Outside / disabled days dimmed */
.sp-mp__calendar :deep(.q-calendar-month__day--outside) {
  background-color: var(--sp-surface-2);
}

.sp-mp__calendar :deep(.q-calendar-month__day--outside .q-calendar-month__day-label) {
  color: var(--sp-text-soft) !important;
}

/* Today highlight — saffron pill behind the day number */
.sp-mp__calendar :deep(.q-current-day .q-calendar-month__day-label__wrapper) {
  position: relative;
}

.sp-mp__calendar :deep(.q-current-day .q-calendar-month__day-label) {
  color: #fff !important;
  font-weight: 800;
  background: var(--sp-secondary);
  border-radius: var(--sp-r-pill);
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 4px 0 0 4px;
  box-shadow: 0 2px 6px rgba(221, 107, 32, 0.4);
}

/* Day cell contents */
.sp-mp__day {
  position: relative;
  width: 100%;
  min-height: 116px;
  padding: 6px 8px 10px;
  /* Allow vertical scroll on touch; horizontal drag still triggers range-select
     because the JS axis-gate commits before the browser starts panning. */
  touch-action: pan-y;
  user-select: none;
}

/* Subtle "+" affordance on hover to telegraph that empty days are clickable. */
.sp-mp__day::after {
  content: 'add';
  font-family: 'Material Icons';
  font-size: 18px;
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--sp-secondary);
  color: #fff;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  box-shadow: 0 2px 6px rgba(221, 107, 32, 0.35);
}

.sp-mp__day-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

/* Meal chips */
.sp-mp__chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition: transform 0.1s, box-shadow 0.1s;
  line-height: 1.25;
}

.sp-mp__chip:hover {
  transform: translateX(1px);
  box-shadow: var(--sp-shadow-1);
}

.sp-mp__chip-icon {
  flex-shrink: 0;
}

.sp-mp__chip-dot {
  font-size: 0.5rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.sp-mp__chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.sp-mp__chip-servings {
  font-size: 0.7rem;
  opacity: 0.75;
  font-weight: 700;
  padding-left: 2px;
}

.sp-mp__chip--leftover {
  font-style: italic;
}

/* "+N more" pill — appears when a day has more entries than fit. */
.sp-mp__more {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed var(--sp-border);
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--sp-r-pill);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;
  margin-top: 1px;
}

.sp-mp__more:hover {
  background: var(--sp-secondary-soft);
  border-color: var(--sp-secondary);
  color: var(--sp-secondary);
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
  touch-action: pan-y;
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--sp-surface);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: var(--sp-text);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--sp-shadow-1);
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

/* -------- Agenda list (multi-day grouped list) -------- */
.sp-mp__agenda-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 14px 16px;
}

.sp-mp__agenda-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border-radius: var(--sp-r-md);
  background: var(--sp-surface);
  border: 1px solid var(--sp-divider);
}

.sp-mp__agenda-section--today {
  background: linear-gradient(180deg, var(--sp-primary-soft) 0%, var(--sp-surface) 100%);
  border-color: var(--sp-primary);
}

.sp-mp__agenda-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--sp-divider);
}

.sp-mp__agenda-section-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--sp-text);
}

.sp-mp__agenda-section--today .sp-mp__agenda-section-title {
  color: var(--sp-primary);
}

.sp-mp__agenda-section-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--sp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* -------- Empty state overlay -------- */
.sp-mp__empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(2px);
  pointer-events: none;
  z-index: 5;
}

.sp-mp__empty-card {
  text-align: center;
  padding: 28px 36px;
  max-width: 420px;
  pointer-events: auto;
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-lg);
  box-shadow: var(--sp-shadow-2);
}

.sp-fade-enter-active, .sp-fade-leave-active {
  transition: opacity 0.25s;
}
.sp-fade-enter-from, .sp-fade-leave-to {
  opacity: 0;
}

/* -------- Responsive --------
   Three tiers: tablet (≤1024), small tablet (≤768), mobile (≤480). The old
   single 768px break crammed tablets into a phone layout. */
@media (max-width: 1024px) {
  .sp-mp__calendar :deep(.q-calendar-month__day) {
    min-height: 124px;
  }

  .sp-mp__day {
    min-height: 96px;
  }
}

@media (max-width: 768px) {
  .sp-mp__calendar-card {
    min-height: 520px;
  }

  .sp-mp__calendar :deep(.q-calendar-month__day) {
    min-height: 96px;
  }

  .sp-mp__calendar :deep(.q-calendar-month__head-weekday),
  .sp-mp__calendar :deep(.q-calendar-agenda__head-weekday-label) {
    padding: 10px 4px;
    font-size: 0.62rem;
    letter-spacing: 0.06em;
  }

  .sp-mp__calendar :deep(.q-calendar-month__day-label) {
    font-size: 0.78rem;
    padding: 4px 6px 0;
  }

  .sp-mp__day {
    min-height: 76px;
    padding: 4px 5px 6px;
  }

  .sp-mp__day-entries {
    gap: 3px;
    margin-top: 4px;
  }

  .sp-mp__chip {
    font-size: 0.7rem;
    padding: 3px 7px;
    border-radius: 6px;
    gap: 4px;
  }

  .sp-mp__chip-icon {
    width: 12px;
    height: 12px;
    font-size: 12px;
  }

  .sp-mp__more {
    font-size: 0.65rem;
    padding: 1px 7px;
  }
}

@media (max-width: 480px) {
  .sp-mp__subtoolbar {
    gap: 6px;
  }

  .sp-mp__view-toggle :deep(.q-btn) {
    padding: 2px 8px;
    font-size: 0.72rem;
    min-height: 24px;
  }

  .sp-mp__view-toggle :deep(.q-btn .q-icon) {
    font-size: 0.85rem;
  }

  .sp-mp__today-btn {
    padding: 2px 8px;
    font-size: 0.72rem;
    min-height: 24px;
  }

  .sp-mp__calendar :deep(.q-calendar-month__day) {
    min-height: 72px;
  }

  .sp-mp__day {
    min-height: 56px;
    padding: 3px 4px 4px;
  }

  .sp-mp__chip {
    font-size: 0.65rem;
    padding: 2px 5px;
  }

  .sp-mp__chip-servings {
    display: none;
  }

  /* On phones the "+" affordance just adds noise — the FAB is right there. */
  .sp-mp__day::after {
    display: none;
  }
}
</style>
