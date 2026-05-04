<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { usePantryStore } from '@/stores/pantryStore'
import { useItemsStore } from '@/stores/itemsStore'
import { computePantryScore, pantryScoreSortKey, type PantryScore } from '@/composables/useRecipePantryScore'
import { matchesQuery } from '@/utils/search'
import BaseDialog from './BaseDialog.vue'
import { useContentLocale, tName } from '@/services/i18n/translateContent'

const { t } = useI18n({ useScope: 'global' })
const itemsLocale = useContentLocale()
const itemsStore = useItemsStore()
const resolveItemName = (itemId: string, fallback: string): string => {
  const item = itemsStore.allItems.find(i => i._id === itemId)
  return item ? (tName(item, itemsLocale.value) || item.name || fallback) : fallback
}

interface Props {
  modelValue: boolean
  cookDate?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', recipe: Recipe): void
}>()

const recipesStore = useRecipesStore()
const pantryStore = usePantryStore()

const searchQuery = ref('')
const activeFilter = ref<'all' | 'have'>('all')

// Refresh pantry every time the dialog opens so scores reflect current stock
watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    pantryStore.fetchItems()
  }
})

interface ScoredRecipe { recipe: Recipe; score: PantryScore }

const scored = computed<ScoredRecipe[]>(() => {
  // Reactive deps: items language change should re-resolve missing-ingredient
  // names via resolveItemName closure capturing itemsLocale.
  void itemsLocale.value
  return recipesStore.items.map((r) => ({
    recipe: r,
    score: computePantryScore(r, pantryStore.items, resolveItemName)
  }))
})

const filtered = computed<ScoredRecipe[]>(() => {
  let list = scored.value

  if (activeFilter.value === 'have') {
    list = list.filter((s) => s.score.covered > 0)
  }

  if (searchQuery.value.trim()) {
    list = list.filter(({ recipe: r }) =>
      matchesQuery(searchQuery.value, r.name, ...((r.searchNames as string[] | undefined) ?? []))
    )
  }

  return [...list].sort((a, b) => {
    const diff = pantryScoreSortKey(b.score) - pantryScoreSortKey(a.score)
    return diff !== 0 ? diff : a.recipe.name.localeCompare(b.recipe.name)
  })
})

function coverageLabel(score: PantryScore): string {
  if (score.pct === null) return t('suggestion.noItemsLinked')
  return t('suggestion.inPantry', { covered: score.covered, total: score.total })
}

function coverageColor(score: PantryScore): string {
  if (score.pct === null) return 'grey-4'
  if (score.pct === 1) return 'positive'
  if (score.pct > 0) return 'warning'
  return 'grey-4'
}

function coverageTextColor(score: PantryScore): string {
  if (score.pct === null || score.pct === 0) return 'grey-7'
  return 'white'
}

function captionText(recipe: Recipe, score: PantryScore): string {
  const parts: string[] = [recipe.recipeType === 'global' ? t('items.globalItem') : t('items.groupItem')]
  if (score.pct !== null && score.pct < 1 && score.missing.length) {
    const shown = score.missing.slice(0, 2).join(', ')
    const more = score.missing.length > 2 ? ` +${score.missing.length - 2}` : ''
    parts.push(`${t('suggestion.missing')}: ${shown}${more}`)
  }
  return parts.join(' · ')
}

function recipeDisplayName(recipe: Recipe): string {
  return tName(recipe as any, itemsLocale.value) || recipe.name
}

function handleSelect(recipe: Recipe) {
  emit('select', recipe)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="t('suggestion.title')"
    header-icon="auto_awesome"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Sticky search + filter bar -->
    <div class="sp-sugg__toolbar">
      <q-input
        v-model="searchQuery"
        :placeholder="t('suggestion.placeholder')"
        dense
        outlined
        clearable
        class="sp-sugg__search"
      >
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>
      <q-btn-toggle
        v-model="activeFilter"
        :options="[
          { label: t('suggestion.all'), value: 'all' },
          { label: t('suggestion.haveIngredients'), value: 'have' }
        ]"
        toggle-color="primary"
        color="white"
        text-color="grey-8"
        unelevated
        no-caps
        dense
        class="sp-sugg__filter"
      />
    </div>

    <!-- Loading state -->
    <q-linear-progress
      v-if="pantryStore.loading"
      indeterminate
      color="primary"
      class="sp-sugg__loading"
    />

    <!-- Recipe list -->
    <q-list separator class="sp-sugg__list">
      <q-item
        v-for="{ recipe, score } in filtered"
        :key="recipe._id"
        clickable
        v-ripple
        class="sp-sugg__item"
        @click="handleSelect(recipe)"
      >
        <q-item-section avatar class="sp-sugg__avatar">
          <span class="sp-sugg__icon">{{ recipe.icon || '🍽️' }}</span>
        </q-item-section>
        <q-item-section>
          <q-item-label class="sp-sugg__name">{{ recipeDisplayName(recipe) }}</q-item-label>
          <q-item-label caption class="sp-sugg__caption">{{ captionText(recipe, score) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            :color="coverageColor(score)"
            :text-color="coverageTextColor(score)"
            class="sp-sugg__badge"
          >
            {{ coverageLabel(score) }}
          </q-badge>
        </q-item-section>
      </q-item>

      <q-item v-if="filtered.length === 0">
        <q-item-section class="text-center text-grey-5 q-py-md">
          {{ t('items.noneFound') }}
        </q-item-section>
      </q-item>
    </q-list>
  </BaseDialog>
</template>

<style scoped>
/* Sticky toolbar: negative margin + negative top collapses the body padding so
   the search bar stays pinned while the list scrolls beneath it. */
.sp-sugg__toolbar {
  position: sticky;
  top: -16px;
  margin: -16px -20px 0;
  padding: 14px 20px 12px;
  background: var(--sp-surface);
  border-bottom: 1px solid var(--sp-divider);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-sugg__search {
  width: 100%;
}

.sp-sugg__filter {
  background-color: var(--sp-surface-2);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--sp-border);
  align-self: flex-start;
}

.sp-sugg__filter :deep(.q-btn) {
  border-radius: 6px;
  padding: 3px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  min-height: 26px;
}

.sp-sugg__filter :deep(.q-btn--active) {
  box-shadow: var(--sp-shadow-1);
}

.sp-sugg__loading {
  height: 2px;
  margin: 0 -20px;
}

.sp-sugg__list {
  margin: 0 -20px;
}

.sp-sugg__avatar {
  min-width: 44px;
}

.sp-sugg__icon {
  font-size: 1.5rem;
  line-height: 1;
}

.sp-sugg__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--sp-text);
}

.sp-sugg__caption {
  font-size: 0.78rem;
  color: var(--sp-text-muted);
  margin-top: 2px;
}

.sp-sugg__badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--sp-r-pill);
  white-space: nowrap;
}

.sp-sugg__item {
  transition: background-color 0.12s;
}
</style>
