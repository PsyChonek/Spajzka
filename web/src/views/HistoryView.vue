<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useHistoryStore, type HistoryEntityFilter, type HistoryActionFilter } from '@/stores/historyStore'
import type { HistoryEntry } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseDialog from '@/components/BaseDialog.vue'

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

const showClearRangeDialog = ref(false)
const rangeFrom = ref<string>('')
const rangeTo = ref<string>('')

const historyStore = useHistoryStore()

const entityTypeOptions = computed<{ label: string; value: HistoryEntityFilter; icon: string }[]>(() => [
  { label: t('nav.pantry'), value: 'pantry', icon: 'kitchen' },
  { label: t('nav.shopping'), value: 'shopping', icon: 'shopping_cart' },
  { label: t('nav.mealPlan'), value: 'mealPlan', icon: 'event' },
  { label: t('nav.recipes'), value: 'recipe', icon: 'restaurant_menu' },
  { label: t('common.tags'), value: 'tag', icon: 'label' },
  { label: t('nav.items'), value: 'item', icon: 'inventory' },
  { label: t('nav.groups'), value: 'group', icon: 'group' }
])

const actionOptions = computed<{ label: string; value: HistoryActionFilter | null }[]>(() => [
  { label: t('history.allActions'), value: null },
  { label: t('history.actions.create'), value: 'create' },
  { label: t('history.actions.update'), value: 'update' },
  { label: t('history.actions.delete'), value: 'delete' },
  { label: t('history.actions.join'), value: 'join' },
  { label: t('history.actions.leave'), value: 'leave' },
  { label: t('history.actions.kick'), value: 'kick' },
  { label: t('history.actions.role_change'), value: 'role_change' }
])

const actionLabels = computed<Record<string, string>>(() => ({
  create: t('history.actions.create'),
  update: t('history.actions.update'),
  delete: t('history.actions.delete'),
  join: t('history.actions.join'),
  leave: t('history.actions.leave'),
  kick: t('history.actions.kick'),
  role_change: t('history.actions.role_change')
}))

const entityLabels = computed<Record<string, string>>(() => ({
  pantry: t('history.entities.pantry'),
  shopping: t('history.entities.shopping'),
  mealPlan: t('history.entities.mealPlan'),
  recipe: t('history.entities.recipe'),
  tag: t('history.entities.tag'),
  item: t('history.entities.item'),
  group: t('history.entities.group')
}))

const actionColors: Record<string, string> = {
  create: 'positive', update: 'primary', delete: 'negative',
  join: 'positive', leave: 'warning', kick: 'negative', role_change: 'info'
}

const actionIcons: Record<string, string> = {
  create: 'add_circle', update: 'edit', delete: 'delete',
  join: 'login', leave: 'logout', kick: 'person_remove', role_change: 'admin_panel_settings'
}

const hasEntries = computed(() => historyStore.entries.length > 0)

function entrySummary(entry: HistoryEntry): string {
  const a = actionLabels.value[entry.action ?? ''] ?? entry.action ?? ''
  const e = entityLabels.value[entry.entityType ?? ''] ?? entry.entityType ?? ''
  return `${a} ${e}: ${entry.entityName ?? t('history.unnamed')}`
}

function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return t('time.justNow')
  if (min < 60) return t('time.minutesAgo', { n: min })
  const hr = Math.round(min / 60)
  if (hr < 24) return t('time.hoursAgo', { n: hr })
  const day = Math.round(hr / 24)
  if (day < 7) return t('time.daysAgo', { n: day })
  return date.toLocaleDateString()
}

function hasDiff(entry: HistoryEntry): boolean {
  const c = entry.changes as { before?: unknown; after?: unknown } | null | undefined
  return !!(c && (c.before || c.after))
}

function toggleEntityType(value: HistoryEntityFilter) {
  const cur = historyStore.filterEntityTypes
  historyStore.setEntityTypes(cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value])
}

function clearFilters() {
  historyStore.setEntityTypes([])
  historyStore.setAction(null)
}

function confirmClearAll() {
  $q.dialog({
    title: 'Clear all history?',
    message: 'This will permanently delete every history entry for this group. This cannot be undone.',
    cancel: true, persistent: true,
    ok: { label: 'Clear all', color: 'negative' }
  }).onOk(() => historyStore.clearHistory())
}

function confirmClearOlderThan(days: number) {
  const cutoff = new Date(Date.now() - days * 86_400_000)
  $q.dialog({
    title: `Clear entries older than ${days} days?`,
    message: `This will permanently delete entries from before ${cutoff.toLocaleDateString()}.`,
    cancel: true, persistent: true,
    ok: { label: 'Clear', color: 'negative' }
  }).onOk(() => historyStore.clearHistory({ before: cutoff.toISOString() }))
}

function openClearRangeDialog() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
  rangeFrom.value = weekAgo.toISOString().slice(0, 10)
  rangeTo.value = now.toISOString().slice(0, 10)
  showClearRangeDialog.value = true
}

function confirmClearRange() {
  if (!rangeFrom.value && !rangeTo.value) return
  const after = rangeFrom.value ? new Date(rangeFrom.value + 'T00:00:00').toISOString() : undefined
  const before = rangeTo.value ? new Date(rangeTo.value + 'T23:59:59.999').toISOString() : undefined
  showClearRangeDialog.value = false
  $q.dialog({
    title: 'Clear entries in this range?',
    message: `Delete entries between ${rangeFrom.value || '(any)'} and ${rangeTo.value || '(any)'}. This cannot be undone.`,
    cancel: true, persistent: true,
    ok: { label: 'Clear', color: 'negative' }
  }).onOk(() => historyStore.clearHistory({ before, after }))
}

function confirmDeleteEntry(entry: HistoryEntry) {
  if (!entry._id) return
  const id = entry._id
  $q.dialog({
    title: 'Delete entry?',
    message: `Delete the history entry for "${entry.entityName ?? 'this item'}"?`,
    cancel: true, persistent: true,
    ok: { label: 'Delete', color: 'negative' }
  }).onOk(() => historyStore.deleteEntry(id))
}

const subtitle = computed(() => {
  const c = historyStore.entries.length
  if (c === 0) return 'No activity recorded yet'
  return `${c} entr${c === 1 ? 'y' : 'ies'} loaded`
})

onMounted(() => historyStore.fetchInitial())
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader :title="t('history.title')" :subtitle="subtitle" icon="history">
        <template #actions>
          <q-btn
            flat
            dense
            round
            icon="refresh"
            :aria-label="t('common.more')"
            :loading="historyStore.loading"
            @click="historyStore.fetchInitial()"
          />
          <q-btn flat dense round icon="more_vert" :aria-label="t('common.more')">
            <q-menu>
              <q-list style="min-width: 240px">
                <q-item clickable v-close-popup @click="confirmClearOlderThan(7)">
                  <q-item-section avatar><q-icon name="schedule" /></q-item-section>
                  <q-item-section>{{ t('history.clearOlder', { n: 7 }) }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="confirmClearOlderThan(30)">
                  <q-item-section avatar><q-icon name="schedule" /></q-item-section>
                  <q-item-section>{{ t('history.clearOlder', { n: 30 }) }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="confirmClearOlderThan(90)">
                  <q-item-section avatar><q-icon name="schedule" /></q-item-section>
                  <q-item-section>{{ t('history.clearOlder', { n: 90 }) }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="openClearRangeDialog">
                  <q-item-section avatar><q-icon name="date_range" /></q-item-section>
                  <q-item-section>{{ t('history.clearByRange') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup class="text-negative" @click="confirmClearAll">
                  <q-item-section avatar><q-icon name="delete_forever" /></q-item-section>
                  <q-item-section>{{ t('history.clearAll') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
      </PageHeader>

      <div class="sp-history__filters">
        <div class="text-caption text-grey-7 q-mb-xs">{{ t('history.filterByType') }}</div>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="opt in entityTypeOptions"
            :key="opt.value"
            clickable
            :selected="historyStore.filterEntityTypes.includes(opt.value)"
            :icon="opt.icon"
            :color="historyStore.filterEntityTypes.includes(opt.value) ? 'primary' : undefined"
            :text-color="historyStore.filterEntityTypes.includes(opt.value) ? 'white' : undefined"
            @click="toggleEntityType(opt.value)"
          >
            {{ opt.label }}
          </q-chip>
        </div>

        <div class="row q-gutter-sm q-mt-sm items-center">
          <q-select
            :model-value="historyStore.filterAction"
            :options="actionOptions"
            option-value="value"
            option-label="label"
            emit-value map-options
            :label="t('history.action')"
            outlined dense
            style="min-width: 180px"
            @update:model-value="historyStore.setAction($event)"
          />
          <q-btn
            v-if="historyStore.filterEntityTypes.length > 0 || historyStore.filterAction"
            flat dense no-caps
            :label="t('history.clearFilters')"
            icon="clear"
            @click="clearFilters"
          />
        </div>
      </div>

      <q-inner-loading :showing="historyStore.loading && !hasEntries" />

      <EmptyState
        v-if="historyStore.isEmpty"
        icon="history"
        :title="t('home.noActivity')"
        :hint="t('history.emptyHint')"
      />

      <q-list v-else class="sp-history__list">
        <q-expansion-item
          v-for="entry in historyStore.sortedEntries"
          :key="entry._id ?? ''"
          :disable="!hasDiff(entry)"
          dense
          expand-separator
          class="sp-history__item"
        >
          <template #header>
            <q-item-section avatar>
              <q-avatar
                :color="actionColors[entry.action ?? ''] ?? 'grey'"
                text-color="white"
                :icon="actionIcons[entry.action ?? ''] ?? 'history'"
                size="36px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ entrySummary(entry) }}</q-item-label>
              <q-item-label caption>
                {{ entry.userEmail ?? t('history.unknownUser') }} · {{ formatTimestamp(entry.timestamp) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat round dense size="sm"
                icon="delete" color="grey-7"
                :aria-label="t('common.delete')"
                @click.stop="confirmDeleteEntry(entry)"
              />
            </q-item-section>
          </template>
          <div class="sp-history__diff">
            <pre class="sp-history__pre">{{ JSON.stringify(entry.changes, null, 2) }}</pre>
            <div v-if="entry.metadata" class="text-caption text-grey-7 q-mt-sm">
              <strong>metadata:</strong> {{ JSON.stringify(entry.metadata) }}
            </div>
          </div>
        </q-expansion-item>
      </q-list>

      <div v-if="historyStore.hasMore" class="row justify-center q-my-md">
        <q-btn
          flat color="primary" no-caps
          :loading="historyStore.loadingMore"
          :label="t('history.loadMore')"
          @click="historyStore.fetchMore()"
        />
      </div>

      <BaseDialog
        v-model="showClearRangeDialog"
        :title="t('history.clearByRange')"
        :subtitle="t('history.clearByRangeHint')"
        header-icon="delete_sweep"
        header-icon-color="negative"
        size="sm"
      >
        <div class="q-gutter-sm">
          <q-input v-model="rangeFrom" :label="t('history.from')" type="date" outlined stack-label />
          <q-input v-model="rangeTo" :label="t('history.to')" type="date" outlined stack-label />
        </div>

        <template #footer="{ close }">
          <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="close" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            :label="t('history.deleteRange')"
            :disable="!rangeFrom && !rangeTo"
            @click="confirmClearRange"
          />
        </template>
      </BaseDialog>
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-history__filters {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
}

.sp-history__list {
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  overflow: hidden;
}

.sp-history__item {
  border-bottom: 1px solid var(--sp-divider);
}

.sp-history__item:last-child {
  border-bottom: none;
}

.sp-history__diff {
  background: var(--sp-surface-2);
  padding: 12px 16px;
}

.sp-history__pre {
  font-family: 'JetBrains Mono', 'Menlo', 'Courier New', monospace;
  font-size: 0.82rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sp-text);
}
</style>
