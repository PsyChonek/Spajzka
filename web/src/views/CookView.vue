<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import PageWrapper from '@/components/PageWrapper.vue'
import SearchInput from '@/components/SearchInput.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import IngredientsList from '@/components/IngredientsList.vue'
import InstructionsList from '@/components/InstructionsList.vue'
import ServingsAdjuster from '@/components/ServingsAdjuster.vue'

const recipesStore = useRecipesStore()

const searchQuery = ref('')
const selectedRecipe = ref<Recipe | null>(null)
const checkedIngredients = ref<Set<number>>(new Set())
const checkedInstructions = ref<Set<number>>(new Set())
const currentInstructionStep = ref<number>(0)
const keepScreenActive = ref(false)
const adjustedServings = ref<number>(1)

// Wake Lock API support
let wakeLock: any = null

const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen')
      console.log('Wake Lock activated')
    }
  } catch (err) {
    console.error('Wake Lock error:', err)
  }
}

const releaseWakeLock = async () => {
  if (wakeLock !== null) {
    try {
      await wakeLock.release()
      wakeLock = null
      console.log('Wake Lock released')
    } catch (err) {
      console.error('Wake Lock release error:', err)
    }
  }
}

// Watch for keep screen active toggle
watch(keepScreenActive, (newValue) => {
  if (newValue) {
    requestWakeLock()
  } else {
    releaseWakeLock()
  }
})

// Release wake lock when component is unmounted or recipe is deselected
watch(selectedRecipe, (newValue) => {
  if (!newValue) {
    keepScreenActive.value = false
    releaseWakeLock()
  }
})

onUnmounted(() => {
  releaseWakeLock()
})

// Computed
const displayedRecipes = computed(() => {
  const allRecipes = recipesStore.sortedItems

  if (!searchQuery.value) return allRecipes

  const query = searchQuery.value.toLowerCase()
  return allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(query) ||
    (recipe.description && recipe.description.toLowerCase().includes(query))
  )
})

const servingsMultiplier = computed(() => {
  if (!selectedRecipe.value || !selectedRecipe.value.servings) return 1
  return adjustedServings.value / selectedRecipe.value.servings
})

// Actions
const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe
  adjustedServings.value = recipe.servings
  checkedIngredients.value.clear()
  checkedInstructions.value.clear()
  currentInstructionStep.value = 0
}

const goBack = () => {
  selectedRecipe.value = null
  searchQuery.value = ''
  checkedIngredients.value.clear()
  checkedInstructions.value.clear()
  currentInstructionStep.value = 0
}

const toggleIngredient = (index: number) => {
  if (checkedIngredients.value.has(index)) {
    checkedIngredients.value.delete(index)
  } else {
    checkedIngredients.value.add(index)
  }
}

const toggleInstruction = (index: number) => {
  if (checkedInstructions.value.has(index)) {
    checkedInstructions.value.delete(index)
  } else {
    checkedInstructions.value.add(index)

    // If checking the current step, automatically move to the next one
    if (index === currentInstructionStep.value) {
      nextStep()
    }
  }
}

const setCurrentStep = (index: number) => {
  currentInstructionStep.value = index
}

const nextStep = () => {
  if (selectedRecipe.value?.instructions && currentInstructionStep.value < selectedRecipe.value.instructions.length - 1) {
    currentInstructionStep.value++
  }
}

const previousStep = () => {
  if (currentInstructionStep.value > 0) {
    currentInstructionStep.value--
  }
}
</script>

<template>
  <PageWrapper>
    <div class="cook-view">
      <!-- Recipe Selection Screen -->
      <div v-if="!selectedRecipe" class="recipe-selection">
        <div class="search-container">
          <SearchInput v-model="searchQuery" placeholder="Search recipes to cook..." />
        </div>

        <div class="recipes-list q-mt-lg">
          <RecipeCard
            v-for="recipe in displayedRecipes"
            :key="recipe._id"
            :recipe="recipe"
            @click="selectRecipe"
          />

          <div v-if="displayedRecipes.length === 0" class="text-center q-mt-xl">
            <q-icon size="4em" name="restaurant_menu" color="grey-5" />
            <div class="text-h6 text-grey-6 q-mt-md">No recipes found</div>
          </div>
        </div>
      </div>

      <!-- Cooking Screen -->
      <div v-else class="cooking-screen">
        <!-- Header with back button -->
        <div class="cooking-header q-mb-md">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            @click="goBack"
            class="q-mr-md"
          />
          <div class="recipe-title">
            <div class="recipe-icon-large">{{ selectedRecipe.icon || '🍽️' }}</div>
            <div>
              <div class="text-h5">{{ selectedRecipe.name }}</div>
              <div class="text-caption text-grey-7">{{ selectedRecipe.servings }} servings</div>
            </div>
          </div>
        </div>

        <!-- Controls Row - Full Width -->
        <div class="controls-row-container">
          <div class="controls-row row items-center">
            <!-- Servings Adjustment -->
            <ServingsAdjuster
              :servings="adjustedServings"
              :original-servings="selectedRecipe.servings"
              @update:servings="adjustedServings = $event"
            />

            <q-space />

            <!-- Screen Lock Toggle -->
            <q-toggle
              v-model="keepScreenActive"
              color="primary"
              icon="screen_lock_portrait"
              size="lg"
            >
              <q-tooltip>Keep screen active while cooking</q-tooltip>
            </q-toggle>
          </div>
        </div>

        <!-- Content Container -->
        <div class="content-container">
          <!-- Ingredients Section -->
          <div class="q-mb-xl">
            <IngredientsList
              :ingredients="selectedRecipe.ingredients || []"
              :checked-ingredients="checkedIngredients"
              :servings-multiplier="servingsMultiplier"
              :show-checkboxes="true"
              @toggle-ingredient="toggleIngredient"
            />
          </div>

          <!-- Instructions Section -->
          <InstructionsList
            :instructions="selectedRecipe.instructions || []"
            :checked-instructions="checkedInstructions"
            :current-step="currentInstructionStep"
            :show-checkboxes="true"
            :show-navigation="true"
            @toggle-instruction="toggleInstruction"
            @set-current-step="setCurrentStep"
            @next-step="nextStep"
            @previous-step="previousStep"
          />
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<style scoped>
.cook-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Recipe Selection */
.recipe-selection {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.recipes-list {
  width: 100%;
}

/* Cooking Screen */
.cooking-screen {
  width: 100%;
  margin: 0 auto;
}

.cooking-header {
  display: flex;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
}

.recipe-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.recipe-icon-large {
  font-size: 3.5rem;
  line-height: 1;
}

/* Controls Row - Full Width */
.controls-row-container {
  width: 100%;
  background-color: rgba(var(--q-primary-rgb), 0.05);
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.controls-row {
  flex-shrink: 0;
  max-width: 900px;
  margin: 0 auto;
}

/* Content Container */
.content-container {
  max-width: 900px;
  margin: 0 auto;
}


/* Mobile responsive */
@media (max-width: 599px) {
  .recipe-icon-large {
    font-size: 2.5rem;
  }

  .cooking-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
