<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n({ useScope: 'global' })
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
  if (h < 5) return t('time.lateNight')
  if (h < 12) return t('time.goodMorning')
  if (h < 18) return t('time.goodAfternoon')
  return t('time.goodEvening')
})

const userName = computed(() => {
  const e = authStore.user?.email
  if (!e) return ''
  return e.split('@')[0]
})

const quickActions = computed(() => [
  { icon: 'add_shopping_cart', label: t('home.addToShopping'), route: '/shopping', color: 'primary' },
  { icon: 'restaurant_menu', label: t('home.browseRecipes'), route: '/recipes', color: 'primary' },
  { icon: 'event', label: t('home.planMeal'), route: '/meal-plan', color: 'secondary' }
])

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
  if (diff < 60) return t('time.justNow')
  if (diff < 3600) return t('time.minutesAgo', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('time.hoursAgo', { n: Math.floor(diff / 3600) })
  if (diff < 86400 * 7) return t('time.daysAgo', { n: Math.floor(diff / 86400) })
  return date.toLocaleDateString()
}

const navigateTo = (path: string) => router.push(path)
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader
        :subtitle="userName
          ? t('home.subtitleWithName', { greeting, name: userName })
          : t('home.subtitle', { greeting })"
      />

      <!-- Stats -->
      <section class="sp-stats-grid sp-section">
        <Stat
          :label="t('home.stats.pantry')"
          :value="pantryCount"
          icon="kitchen"
          color="primary"
          to="/pantry"
        />
        <Stat
          :label="t('home.stats.toBuy')"
          :value="shoppingPending"
          icon="shopping_cart"
          color="secondary"
          to="/shopping"
        />
        <Stat
          :label="t('home.stats.recipes')"
          :value="recipeCount"
          icon="restaurant_menu"
          color="primary"
          to="/recipes"
        />
        <Stat
          :label="t('home.stats.mealsThisWeek')"
          :value="upcomingMeals"
          icon="event"
          color="secondary"
          to="/meal-plan"
        />
      </section>

      <!-- Quick actions -->
      <SectionCard :title="t('home.quickActions')" :subtitle="t('home.quickActionsHint')">
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
      <SectionCard :title="t('home.recentActivity')">
        <template #actions>
          <q-btn
            flat
            no-caps
            :label="t('home.viewAll')"
            icon-right="chevron_right"
            color="primary"
            @click="navigateTo('/history')"
          />
        </template>

        <EmptyState
          v-if="recentActivity.length === 0"
          icon="history"
          :title="t('home.noActivity')"
          :hint="t('home.noActivityHint')"
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
