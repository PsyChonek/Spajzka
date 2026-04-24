<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useHistoryStore, type HistoryEntityFilter, type HistoryActionFilter } from '@/stores/historyStore'
import type { HistoryEntry } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'

const historyStore = useHistoryStore()

const entityTypeOptions: { label: string; value: HistoryEntityFilter; icon: string }[] = [
  { label: 'Pantry', value: 'pantry', icon: 'kitchen' },
  { label: 'Shopping', value: 'shopping', icon: 'shopping_cart' },
  { label: 'Meal Plan', value: 'mealPlan', icon: 'event' },
  { label: 'Recipes', value: 'recipe', icon: 'restaurant_menu' },
  { label: 'Tags', value: 'tag', icon: 'label' },
  { label: 'Items', value: 'item', icon: 'inventory' },
  { label: 'Group', value: 'group', icon: 'group' }
]

const actionOptions: { label: string; value: HistoryActionFilter | null }[] = [
  { label: 'All actions', value: null },
  { label: 'Created', value: 'create' },
  { label: 'Updated', value: 'update' },
  { label: 'Deleted', value: 'delete' },
  { label: 'Joined', value: 'join' },
  { label: 'Left', value: 'leave' },
  { label: 'Kicked', value: 'kick' },
  { label: 'Role change', value: 'role_change' }
]

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  join: 'Joined',
  leave: 'Left',
  kick: 'Kicked',
  role_change: 'Role changed'
}

const entityLabels: Record<string, string> = {
  pantry: 'pantry item',
  shopping: 'shopping item',
  mealPlan: 'meal plan',
  recipe: 'recipe',
  tag: 'tag',
  item: 'item',
  group: 'group'
}

const actionColors: Record<string, string> = {
  create: 'positive',
  update: 'primary',
  delete: 'negative',
  join: 'positive',
  leave: 'warning',
  kick: 'negative',
  role_change: 'info'
}

const actionIcons: Record<string, string> = {
  create: 'add_circle',
  update: 'edit',
  delete: 'delete',
  join: 'login',
  leave: 'logout',
  kick: 'person_remove',
  role_change: 'admin_panel_settings'
}

const hasEntries = computed(() => historyStore.entries.length > 0)

function entrySummary(entry: HistoryEntry): string {
  const actionLabel = actionLabels[entry.action ?? ''] ?? entry.action ?? ''
  const entityLabel = entityLabels[entry.entityType ?? ''] ?? entry.entityType ?? ''
  return `${actionLabel} ${entityLabel}: ${entry.entityName ?? '(unnamed)'}`
}

function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay} d ago`
  return date.toLocaleDateString()
}

function hasDiff(entry: HistoryEntry): boolean {
  const changes = entry.changes as { before?: unknown; after?: unknown } | null | undefined
  if (!changes) return false
  return !!(changes.before || changes.after)
}

function toggleEntityType(value: HistoryEntityFilter) {
  const current = historyStore.filterEntityTypes
  const next = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value]
  historyStore.setEntityTypes(next)
}

function clearFilters() {
  historyStore.setEntityTypes([])
  historyStore.setAction(null)
}

onMounted(() => {
  historyStore.fetchInitial()
})
</script>

<template>
  <PageWrapper>
    <div class="row items-center q-mb-md">
      <h4 class="q-my-none">History</h4>
      <q-space />
      <q-btn
        flat
        icon="refresh"
        aria-label="Refresh"
        :loading="historyStore.loading"
        @click="historyStore.fetchInitial()"
      />
    </div>

    <div class="q-mb-md">
      <div class="text-caption text-grey-7 q-mb-xs">Filter by type</div>
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
    </div>

    <div class="row q-gutter-sm q-mb-md items-center">
      <q-select
        :model-value="historyStore.filterAction"
        :options="actionOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        label="Action"
        outlined
        dense
        style="min-width: 180px"
        @update:model-value="historyStore.setAction($event)"
      />
      <q-btn
        v-if="historyStore.filterEntityTypes.length > 0 || historyStore.filterAction"
        flat
        dense
        label="Clear filters"
        icon="clear"
        @click="clearFilters"
      />
    </div>

    <q-inner-loading :showing="historyStore.loading && !hasEntries" />

    <div v-if="historyStore.isEmpty" class="text-grey-7 q-pa-lg text-center">
      No history entries yet. Make some changes — they'll show up here.
    </div>

    <q-list v-else separator>
      <q-expansion-item
        v-for="entry in historyStore.sortedEntries"
        :key="entry._id ?? ''"
        :disable="!hasDiff(entry)"
        dense
        expand-separator
      >
        <template #header>
          <q-item-section avatar>
            <q-avatar
              :color="actionColors[entry.action ?? ''] ?? 'grey'"
              text-color="white"
              :icon="actionIcons[entry.action ?? ''] ?? 'history'"
              size="32px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ entrySummary(entry) }}</q-item-label>
            <q-item-label caption>
              {{ entry.userEmail ?? 'unknown user' }} · {{ formatTimestamp(entry.timestamp) }}
            </q-item-label>
          </q-item-section>
        </template>
        <div class="q-pa-md bg-grey-1">
          <pre class="changes-pre">{{ JSON.stringify(entry.changes, null, 2) }}</pre>
          <div v-if="entry.metadata" class="text-caption text-grey-7 q-mt-sm">
            <strong>metadata:</strong> {{ JSON.stringify(entry.metadata) }}
          </div>
        </div>
      </q-expansion-item>
    </q-list>

    <div v-if="historyStore.hasMore" class="row justify-center q-my-md">
      <q-btn
        flat
        color="primary"
        :loading="historyStore.loadingMore"
        label="Load more"
        @click="historyStore.fetchMore()"
      />
    </div>
  </PageWrapper>
</template>

<style scoped>
.changes-pre {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
