<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import { useAuthStore } from '@/stores/authStore'
import PageWrapper from '@/components/PageWrapper.vue'
import SearchInput from '@/components/SearchInput.vue'
import RecipeDialog, { type RecipeFormData } from '@/components/RecipeDialog.vue'
import TagFilter from '@/components/TagFilter.vue'
import { GlobalRecipe } from '@/api-client'
import { useTagsStore } from '@/stores/tagsStore'

const $q = useQuasar()
const router = useRouter()
const recipesStore = useRecipesStore()
const authStore = useAuthStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showRecipeDialog = ref(false)
const editingRecipe = ref<Recipe | null>(null)

// Computed
const displayedRecipes = computed(() => {
  let recipes = recipesStore.sortedItems

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    recipes = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      (recipe.description && recipe.description.toLowerCase().includes(query))
    )
  }

  // Filter by tags
  if (selectedTagIds.value.length > 0) {
    recipes = recipes.filter(recipe => {
      if (!recipe.tags || recipe.tags.length === 0) return false
      // Recipe must have at least one of the selected tags
      return recipe.tags.some(tagId => selectedTagIds.value.includes(tagId))
    })
  }

  return recipes
})

function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

const canCreateGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:create')
})

const canEditGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:update')
})

const canDeleteGlobalRecipe = computed(() => {
  return authStore.hasGlobalPermission('global_recipes:delete')
})


// Dialog actions
const openAddDialog = () => {
  editingRecipe.value = null
  showRecipeDialog.value = true
}

const openEditDialog = (recipe: Recipe) => {
  editingRecipe.value = recipe
  showRecipeDialog.value = true
}

const handleSaveRecipe = async (recipeData: RecipeFormData) => {
  if (editingRecipe.value) {
    // Update existing recipe
    if (!editingRecipe.value._id) return
    await recipesStore.updateRecipe(editingRecipe.value._id, recipeData)
  } else {
    // Create new recipe
    if (recipeData.recipeType === GlobalRecipe.recipeType.GLOBAL) {
      if (!canCreateGlobalRecipe.value) {
        $q.notify({
          type: 'negative',
          message: 'You do not have permission to create global recipes'
        })
        return
      }
      await recipesStore.addGlobalRecipe(recipeData)
    } else {
      await recipesStore.addGroupRecipe(recipeData)
    }
  }

  // Clear search after adding
  searchQuery.value = ''
  editingRecipe.value = null
}

const deleteRecipe = (recipeId: string) => {
  recipesStore.deleteRecipe(recipeId)
}

const canEditRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canEditGlobalRecipe.value
  return true // Group recipes can always be edited
}

const canDeleteRecipe = (recipe: Recipe) => {
  if (recipe.recipeType === GlobalRecipe.recipeType.GLOBAL) return canDeleteGlobalRecipe.value
  return true // Group recipes can always be deleted
}

const openRecipe = (recipeId: string) => {
  router.push(`/cook/${recipeId}`)
}

</script>

<template>
  <PageWrapper>
    <div class="recipes-view">
      <div class="search-container">
        <SearchInput v-model="searchQuery" placeholder="Search recipes..." @add="openAddDialog" />
      </div>

      <div class="filter-container q-mt-md">
        <TagFilter v-model="selectedTagIds" />
      </div>

      <div class="recipes-grid q-mt-lg">
        <q-card
          v-for="recipe in displayedRecipes"
          :key="recipe._id"
          class="recipe-card"
        >
          <q-card-section class="recipe-content">
            <div class="recipe-header">
              <div class="recipe-icon">{{ recipe.icon || '🍽️' }}</div>
              <div class="recipe-info">
                <div class="recipe-name text-weight-medium">{{ recipe.name }}</div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="recipe.tags && recipe.tags.length > 0" class="recipe-tags q-mt-sm">
              <q-chip
                v-for="tagId in recipe.tags"
                :key="tagId"
                dense
                size="sm"
                :style="{
                  backgroundColor: tagsStore.getTagById(tagId)?.color || '#6200EA',
                  color: getContrastColor(tagsStore.getTagById(tagId)?.color || '#6200EA'),
                  padding: '6px 12px'
                }"
              >
                <span v-if="tagsStore.getTagById(tagId)?.icon" style="margin-right: 6px">{{ tagsStore.getTagById(tagId)?.icon }}</span>
                <span>{{ tagsStore.getTagById(tagId)?.name }}</span>
              </q-chip>
            </div>

            <div class="action-buttons q-mt-md">
              <q-btn
                flat
                dense
                round
                color="positive"
                icon="soup_kitchen"
                size="md"
                @click="recipe._id && openRecipe(recipe._id)"
                :disable="!recipe._id"
              >
                <q-tooltip>Cook this recipe</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="primary"
                icon="edit"
                size="md"
                @click="openEditDialog(recipe)"
                :disable="!canEditRecipe(recipe)"
              >
                <q-tooltip>Edit Recipe</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                size="md"
                @click="recipe._id && deleteRecipe(recipe._id)"
                :disable="!canDeleteRecipe(recipe) || !recipe._id"
              >
                <q-tooltip>Delete recipe</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>

        <div v-if="displayedRecipes.length === 0" class="no-recipes">
          <q-icon size="3em" name="restaurant_menu" />
          <span class="text-h6 q-mt-md">No recipes yet</span>
        </div>
      </div>

      <!-- Recipe Dialog -->
      <RecipeDialog
        v-model="showRecipeDialog"
        :editing-recipe="editingRecipe"
        :initial-name="searchQuery"
        :read-only="editingRecipe ? !canEditRecipe(editingRecipe) : false"
        @save="handleSaveRecipe"
      />
    </div>
  </PageWrapper>
</template>

<style scoped>
.recipes-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 0.5rem;
}

.recipe-card {
  transition: all 0.2s ease;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recipe-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.recipe-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.recipe-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
}

.recipe-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-name {
  font-size: 1.1rem;
  line-height: 1.3;
  word-wrap: break-word;
  word-break: break-word;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.no-recipes {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: rgba(0, 0, 0, 0.4);
}

/* Mobile styles */
@media (max-width: 599px) {
  .recipes-grid {
    grid-template-columns: 1fr;
  }

  .recipe-icon {
    font-size: 2.5rem;
  }

  .recipe-name {
    font-size: 1rem;
  }
}

/* Tablet styles */
@media (min-width: 600px) and (max-width: 1023px) {
  .recipes-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .recipes-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style>
