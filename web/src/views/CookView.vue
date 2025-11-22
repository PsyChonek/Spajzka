<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import PageWrapper from '@/components/PageWrapper.vue'
import SearchInput from '@/components/SearchInput.vue'

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

const adjustedIngredients = computed(() => {
  if (!selectedRecipe.value?.ingredients) return []

  return selectedRecipe.value.ingredients.map(ingredient => ({
    ...ingredient,
    quantity: Number((ingredient.quantity * servingsMultiplier.value).toFixed(2))
  }))
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

const getInstructionOpacity = (index: number) => {
  return index === currentInstructionStep.value ? 1 : 0.4
}

const isCurrentStep = (index: number) => {
  return index === currentInstructionStep.value
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
          <q-card
            v-for="recipe in displayedRecipes"
            :key="recipe._id"
            class="recipe-card q-mb-md cursor-pointer"
            @click="selectRecipe(recipe)"
          >
            <q-card-section class="row items-center">
              <div class="recipe-icon q-mr-md">{{ recipe.icon || '🍽️' }}</div>
              <div class="col">
                <div class="text-h6">{{ recipe.name }}</div>
                <div v-if="recipe.description" class="text-caption text-grey-7">
                  {{ recipe.description }}
                </div>
                <div class="text-caption q-mt-xs">
                  <q-badge color="primary" class="q-mr-xs">
                    {{ recipe.servings }} servings
                  </q-badge>
                  <q-badge color="secondary">
                    {{ recipe.ingredients?.length || 0 }} ingredients
                  </q-badge>
                </div>
              </div>
              <q-icon name="chevron_right" size="md" color="grey-6" />
            </q-card-section>
          </q-card>

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
            <div class="servings-compact row items-center">
              <q-btn
                flat
                round
                dense
                icon="remove"
                color="primary"
                size="sm"
                @click="adjustedServings = Math.max(1, adjustedServings - 1)"
                :disable="adjustedServings <= 1"
              />
              <div class="servings-number q-mx-xs">{{ adjustedServings }}</div>
              <q-btn
                flat
                round
                dense
                icon="add"
                color="primary"
                size="sm"
                @click="adjustedServings++"
              />
              <q-btn
                flat
                dense
                round
                icon="refresh"
                color="grey-7"
                size="sm"
                @click="adjustedServings = selectedRecipe.servings"
                v-if="adjustedServings !== selectedRecipe.servings"
                class="q-ml-xs"
              >
                <q-tooltip>Reset to {{ selectedRecipe.servings }} servings</q-tooltip>
              </q-btn>
            </div>

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
        <div class="ingredients-section q-mb-xl">
          <div class="section-title text-h6 q-mb-md">
            Ingredients
            <span v-if="servingsMultiplier !== 1" class="text-caption text-grey-7">
              (scaled {{ servingsMultiplier > 1 ? 'up' : 'down' }} by {{ servingsMultiplier.toFixed(2) }}x)
            </span>
          </div>
          <q-list bordered separator>
            <q-item
              v-for="(ingredient, index) in adjustedIngredients"
              :key="index"
              clickable
              @click="toggleIngredient(index)"
            >
              <q-item-section avatar>
                <q-checkbox
                  :model-value="checkedIngredients.has(index)"
                  @update:model-value="toggleIngredient(index)"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="{ 'text-strike': checkedIngredients.has(index) }">
                  {{ ingredient.itemName }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  {{ ingredient.quantity }} {{ ingredient.unit }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Instructions Section -->
        <div class="instructions-section">
          <div class="section-title text-h6 q-mb-md">Instructions</div>

          <!-- Step Navigation -->
          <div class="step-navigation q-mb-md">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              @click="previousStep"
              :disable="currentInstructionStep === 0"
            />
            <div class="step-indicator">
              Step {{ currentInstructionStep + 1 }} of {{ selectedRecipe.instructions?.length || 0 }}
            </div>
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              @click="nextStep"
              :disable="currentInstructionStep === (selectedRecipe.instructions?.length || 0) - 1"
            />
          </div>

          <!-- Instructions List -->
          <div class="instructions-list">
            <q-card
              v-for="(instruction, index) in selectedRecipe.instructions"
              :key="index"
              class="instruction-card q-mb-md"
              :class="{ 'current-step': isCurrentStep(index) }"
              :style="{ opacity: getInstructionOpacity(index) }"
              @click="setCurrentStep(index)"
            >
              <q-card-section class="row items-start">
                <div class="step-number q-mr-md">{{ index + 1 }}</div>
                <div class="col">
                  <div class="instruction-text">{{ instruction }}</div>
                </div>
                <q-checkbox
                  :model-value="checkedInstructions.has(index)"
                  @update:model-value="toggleInstruction(index)"
                  color="primary"
                  @click.stop
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
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

.recipe-card {
  transition: all 0.2s ease;
}

.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recipe-icon {
  font-size: 3rem;
  line-height: 1;
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

.section-title {
  font-weight: 600;
  color: var(--q-primary);
}

/* Servings Adjustment */
.servings-compact {
  flex-shrink: 0;
}

.servings-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--q-primary);
  min-width: 30px;
  text-align: center;
}

/* Ingredients */
.ingredients-section {
  animation: fadeIn 0.3s ease;
}

/* Instructions */
.instructions-section {
  animation: fadeIn 0.3s ease 0.1s backwards;
}

.step-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.step-indicator {
  font-weight: 600;
  font-size: 1.1rem;
}

.instructions-list {
  width: 100%;
}

.instruction-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.instruction-card.current-step {
  border-left-color: var(--q-primary);
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.instruction-card:hover {
  transform: translateX(4px);
}

.step-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--q-primary);
  min-width: 40px;
  text-align: center;
}

.instruction-text {
  font-size: 1.1rem;
  line-height: 1.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive */
@media (max-width: 599px) {
  .recipe-icon {
    font-size: 2rem;
  }

  .recipe-icon-large {
    font-size: 2.5rem;
  }

  .cooking-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-number {
    font-size: 1.2rem;
    min-width: 30px;
  }

  .instruction-text {
    font-size: 1rem;
  }
}
</style>
