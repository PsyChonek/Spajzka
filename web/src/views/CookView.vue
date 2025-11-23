<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import PageWrapper from '@/components/PageWrapper.vue'
import IngredientsList from '@/components/IngredientsList.vue'
import InstructionsList from '@/components/InstructionsList.vue'
import ServingsAdjuster from '@/components/ServingsAdjuster.vue'

const route = useRoute()
const router = useRouter()
const recipesStore = useRecipesStore()

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

onMounted(() => {
  // If a recipeId is provided in the route, automatically select that recipe
  const recipeId = route.params.recipeId as string
  if (recipeId) {
    const recipe = recipesStore.items.find(r => r._id === recipeId)
    if (recipe) {
      selectRecipe(recipe)
    }
  }
})

onUnmounted(() => {
  releaseWakeLock()
})

// Computed
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
  // Navigate back to recipes
  router.push('/recipes')
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
      <!-- Cooking Screen -->
      <div v-if="selectedRecipe" class="cooking-screen">
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

      <!-- No Recipe Selected -->
      <div v-else class="no-recipe-selected">
        <q-icon size="4em" name="soup_kitchen" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No recipe selected</div>
        <q-btn
          class="q-mt-md"
          color="primary"
          label="Go to Recipes"
          icon="restaurant_menu"
          @click="router.push('/recipes')"
        />
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

/* No Recipe Selected */
.no-recipe-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
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
