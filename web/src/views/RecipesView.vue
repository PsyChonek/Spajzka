<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { useAuthStore } from '@/stores/authStore'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FabAdd from '@/components/common/FabAdd.vue'
import SearchInput from '@/components/SearchInput.vue'
import RecipeDialog, { type RecipeFormData } from '@/components/RecipeDialog.vue'
import TagFilter from '@/components/TagFilter.vue'
import { GlobalRecipe } from '@shared/api-client'
import { useTagsStore } from '@/stores/tagsStore'
import { matchesQuery } from '@/utils/search'

const $q = useQuasar()
const router = useRouter()
const recipesStore = useRecipesStore()
const authStore = useAuthStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showRecipeDialog = ref(false)
const editingRecipe = ref<Recipe | null>(null)

const displayedRecipes = computed(() => {
  let recipes = recipesStore.sortedItems
  if (searchQuery.value) {
    recipes = recipes.filter(r =>
      matchesQuery(searchQuery.value, r.name, r.description, ...((r.searchNames as string[] | undefined) ?? []))
    )
  }
  if (selectedTagIds.value.length > 0) {
    recipes = recipes.filter(r => {
      if (!r.tags || r.tags.length === 0) return false
      return r.tags.some(t => selectedTagIds.value.includes(t))
    })
  }
  return recipes
})

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#FFF'
}

const canCreateGlobalRecipe = computed(() => authStore.hasGlobalPermission('global_recipes:create'))
const canEditGlobalRecipe = computed(() => authStore.hasGlobalPermission('global_recipes:update'))
const canDeleteGlobalRecipe = computed(() => authStore.hasGlobalPermission('global_recipes:delete'))

const openAddDialog = () => {
  editingRecipe.value = null
  showRecipeDialog.value = true
}

const openEditDialog = (recipe: Recipe) => {
  editingRecipe.value = recipe
  showRecipeDialog.value = true
}

const handleSaveRecipe = async (data: RecipeFormData) => {
  if (editingRecipe.value) {
    if (!editingRecipe.value._id) return
    await recipesStore.updateRecipe(editingRecipe.value._id, data)
  } else {
    if (data.recipeType === GlobalRecipe.recipeType.GLOBAL) {
      if (!canCreateGlobalRecipe.value) {
        $q.notify({ type: 'negative', message: 'You do not have permission to create global recipes' })
        return
      }
      await recipesStore.addGlobalRecipe(data)
    } else {
      await recipesStore.addGroupRecipe(data)
    }
  }
  searchQuery.value = ''
  editingRecipe.value = null
}

const deleteRecipe = (id: string) => recipesStore.deleteRecipe(id)
const canEditRecipe = (r: Recipe) => r.recipeType === GlobalRecipe.recipeType.GLOBAL ? canEditGlobalRecipe.value : true
const canDeleteRecipe = (r: Recipe) => r.recipeType === GlobalRecipe.recipeType.GLOBAL ? canDeleteGlobalRecipe.value : true

const openRecipe = (id: string) => router.push(`/cook/${id}`)

const subtitle = computed(() => {
  const total = recipesStore.sortedItems.length
  if (searchQuery.value || selectedTagIds.value.length > 0) {
    return `${displayedRecipes.value.length} of ${total} recipe${total !== 1 ? 's' : ''}`
  }
  return total === 0 ? 'Build your recipe collection' : `${total} recipe${total !== 1 ? 's' : ''} in collection`
})
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader title="Recipes" :subtitle="subtitle" icon="restaurant_menu">
        <template #actions>
          <q-btn
            color="secondary"
            unelevated
            no-caps
            icon="add"
            label="Add"
            class="gt-sm"
            aria-label="Add recipe"
            @click="openAddDialog"
          />
        </template>
      </PageHeader>

      <div class="sp-recipes__filters">
        <SearchInput v-model="searchQuery" placeholder="Search recipes..." @add="openAddDialog" />
        <div class="q-mt-sm">
          <TagFilter v-model="selectedTagIds" />
        </div>
      </div>

      <EmptyState
        v-if="displayedRecipes.length === 0"
        :icon="searchQuery ? 'search_off' : 'restaurant_menu'"
        :title="searchQuery ? 'No recipes found' : 'No recipes yet'"
        :hint="searchQuery ? 'Try a different search.' : 'Save your favorite dishes here. Tap Add to get started.'"
      >
        <template #action>
          <q-btn color="secondary" unelevated no-caps icon="add" label="Add recipe" @click="openAddDialog" />
        </template>
      </EmptyState>

      <div v-else class="sp-recipes__grid">
        <q-card
          v-for="recipe in displayedRecipes"
          :key="recipe._id"
          flat
          bordered
          class="sp-recipe-card"
          @click="recipe._id && openRecipe(recipe._id)"
        >
          <div class="sp-recipe-card__hero">
            <div class="sp-recipe-card__icon">{{ recipe.icon || '🍽️' }}</div>
            <q-badge
              v-if="recipe.recipeType === GlobalRecipe.recipeType.GLOBAL"
              color="secondary"
              class="sp-recipe-card__badge"
            >
              Global
            </q-badge>
          </div>
          <div class="sp-recipe-card__content">
            <q-card-section class="sp-recipe-card__body">
              <div class="sp-recipe-card__name">{{ recipe.name }}</div>
              <div v-if="recipe.description" class="sp-recipe-card__desc">
                {{ recipe.description }}
              </div>
              <div v-if="recipe.tags && recipe.tags.length > 0" class="sp-recipe-card__tags">
                <q-chip
                  v-for="tagId in recipe.tags.slice(0, 3)"
                  :key="tagId"
                  dense size="sm"
                  :style="{
                    backgroundColor: tagsStore.getTagById(tagId)?.color || '#6200EA',
                    color: getContrastColor(tagsStore.getTagById(tagId)?.color || '#6200EA')
                  }"
                >
                  <span v-if="tagsStore.getTagById(tagId)?.icon" style="margin-right: 4px">
                    {{ tagsStore.getTagById(tagId)?.icon }}
                  </span>
                  {{ tagsStore.getTagById(tagId)?.name }}
                </q-chip>
              </div>
            </q-card-section>
            <q-card-actions class="sp-recipe-card__actions">
              <q-btn
                flat dense color="primary" no-caps
                icon="soup_kitchen" label="Cook"
                :disable="!recipe._id"
                @click.stop="recipe._id && openRecipe(recipe._id)"
              />
              <q-space />
              <q-btn
                flat dense round color="grey-7" icon="edit"
                :disable="!canEditRecipe(recipe)"
                @click.stop="openEditDialog(recipe)"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                flat dense round color="negative" icon="delete"
                :disable="!canDeleteRecipe(recipe) || !recipe._id"
                @click.stop="recipe._id && deleteRecipe(recipe._id)"
              >
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-card-actions>
          </div>
        </q-card>
      </div>

      <FabAdd class="lt-md" aria-label="Add recipe" @click="openAddDialog" />

      <RecipeDialog
        v-model="showRecipeDialog"
        :editing-recipe="editingRecipe"
        :initial-name="searchQuery"
        :read-only="editingRecipe ? !canEditRecipe(editingRecipe) : false"
        @save="handleSaveRecipe"
      />
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-recipes__filters { margin-bottom: 16px; }

.sp-recipes__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

@media (max-width: 599px) {
  .sp-recipes__grid {
    grid-template-columns: 1fr;
  }
}

.sp-recipe-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
  overflow: hidden;
}

.sp-recipe-card:hover {
  transform: translateY(-2px);
  border-color: rgba(47, 125, 95, 0.3);
  box-shadow: var(--sp-shadow-2);
}

.sp-recipe-card__hero {
  background: linear-gradient(135deg, var(--sp-primary-soft) 0%, var(--sp-secondary-soft) 100%);
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.sp-recipe-card__icon {
  font-size: 3rem;
  line-height: 1;
}

.sp-recipe-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.sp-recipe-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.sp-recipe-card__body {
  flex: 1;
  padding: 14px 16px 8px;
}

.sp-recipe-card__name {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--sp-text);
  line-height: 1.25;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sp-recipe-card__desc {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.sp-recipe-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sp-recipe-card__actions {
  padding: 4px 8px 8px;
  border-top: 1px solid var(--sp-divider);
  background: var(--sp-surface);
}

@media (max-width: 599px) {
  .sp-recipe-card {
    flex-direction: row;
  }

  .sp-recipe-card__hero {
    width: 72px;
    height: auto;
  }

  .sp-recipe-card__icon {
    font-size: 2rem;
  }

  .sp-recipe-card__body {
    padding: 10px 12px 4px;
  }
}
</style>
