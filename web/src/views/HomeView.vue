<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import Stat from '@/components/common/Stat.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useRecipesStore } from '@/stores/recipesStore'
import { useMealPlanStore } from '@/stores/mealPlanStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const pantryStore = usePantryStore()
const shoppingStore = useShoppingStore()
const recipesStore = useRecipesStore()
const mealPlanStore = useMealPlanStore()
const historyStore = useHistoryStore()
const authStore = useAuthStore()

const pantryCount = computed(() => pantryStore.items?.length ?? 0)
const shoppingPending = computed(
  () => (shoppingStore.items ?? []).filter((i: any) => !i.completed).length
)
const recipeCount = computed(() => recipesStore.items?.length ?? 0)
const upcomingMeals = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + 7)
  return (mealPlanStore.entries ?? []).filter((e: any) => {
    const d = new Date(e.eatDate ?? e.date ?? '')
    return d >= today && d < horizon
  }).length
})

const recentActivity = computed(() => (historyStore.entries ?? []).slice(0, 5))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const userName = computed(() => {
  const e = authStore.user?.email
  if (!e) return ''
  return e.split('@')[0]
})

const quickActions = [
  { icon: 'add_shopping_cart', label: 'Add to shopping', route: '/shopping', color: 'primary' },
  { icon: 'restaurant_menu', label: 'Browse recipes', route: '/recipes', color: 'primary' },
  { icon: 'event', label: 'Plan a meal', route: '/meal-plan', color: 'secondary' }
]

const formatActivity = (e: any) => {
  const action = e.action ?? ''
  const entity = e.entityType ?? ''
  const name = e.entityName ?? e.itemName ?? e.metadata?.name ?? ''
  return `${capitalize(action)} ${entity}${name ? `: ${name}` : ''}`.trim()
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const formatTime = (ts: any) => {
  if (!ts) return ''
  const date = new Date(ts)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

const navigateTo = (path: string) => router.push(path)
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader
        :title="userName ? `${greeting}, ${userName}` : greeting"
        subtitle="Here's what's in your kitchen today."
      />

      <!-- Stats -->
      <section class="sp-stats-grid sp-section">
        <Stat
          label="In pantry"
          :value="pantryCount"
          icon="kitchen"
          color="primary"
          to="/pantry"
        />
        <Stat
          label="To buy"
          :value="shoppingPending"
          icon="shopping_cart"
          color="secondary"
          to="/shopping"
        />
        <Stat
          label="Recipes"
          :value="recipeCount"
          icon="restaurant_menu"
          color="primary"
          to="/recipes"
        />
        <Stat
          label="Meals this week"
          :value="upcomingMeals"
          icon="event"
          color="secondary"
          to="/meal-plan"
        />
      </section>

      <!-- Quick actions -->
      <SectionCard title="Quick actions" subtitle="Jump into common tasks">
        <div class="sp-quick-grid">
          <q-btn
            v-for="action in quickActions"
            :key="action.route"
            :icon="action.icon"
            :label="action.label"
            :color="action.color"
            unelevated
            no-caps
            class="sp-quick-btn"
            @click="navigateTo(action.route)"
          />
        </div>
      </SectionCard>

      <!-- Recent activity -->
      <SectionCard title="Recent activity">
        <template #actions>
          <q-btn
            flat
            no-caps
            label="View all"
            icon-right="chevron_right"
            color="primary"
            @click="navigateTo('/history')"
          />
        </template>

        <EmptyState
          v-if="recentActivity.length === 0"
          icon="history"
          title="No activity yet"
          hint="Add an item to your pantry or shopping list to see it here."
        />
        <q-list v-else padding separator>
          <q-item
            v-for="entry in recentActivity"
            :key="entry._id"
            class="sp-activity-item"
          >
            <q-item-section avatar>
              <q-avatar size="36px" color="primary" text-color="white" icon="bolt" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ formatActivity(entry) }}</q-item-label>
              <q-item-label caption>{{ formatTime(entry.timestamp) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </SectionCard>
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .sp-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.sp-quick-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 600px) {
  .sp-quick-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.sp-quick-btn {
  height: 56px;
  border-radius: 12px;
  font-weight: 600;
  justify-content: flex-start;
}

.sp-quick-btn :deep(.q-btn__content) {
  justify-content: flex-start;
  padding-left: 8px;
}

.sp-activity-item {
  border-radius: 8px;
}
</style>
