<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore, type Recipe } from '@/stores/recipesStore'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SectionCard from '@/components/common/SectionCard.vue'
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

const pageTitle = computed(() =>
  selectedRecipe.value ? selectedRecipe.value.name : 'Cook'
)

const hasRouteId = computed(() => !!route.params.recipeId)

// Actions
const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe
  adjustedServings.value = recipe.servings
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
  <q-page>
    <PageWrapper>
      <!-- Cooking mode: recipe is loaded -->
      <div v-if="selectedRecipe" class="sp-cook">
        <PageHeader
          :title="pageTitle"
          :back="hasRouteId ? true : undefined"
          icon="soup_kitchen"
        />

        <!-- Sticky controls bar: servings + screen lock -->
        <div class="sp-cook__controls-bar q-mb-md">
          <div class="sp-cook__controls-inner row items-center">
            <ServingsAdjuster
              :servings="adjustedServings"
              :original-servings="selectedRecipe.servings"
              @update:servings="adjustedServings = $event"
            />
            <q-space />
            <div class="row items-center q-gutter-xs">
              <q-toggle
                v-model="keepScreenActive"
                color="primary"
                icon="screen_lock_portrait"
                size="lg"
              >
                <q-tooltip>Keep screen active while cooking</q-tooltip>
              </q-toggle>
              <span class="sp-cook__lock-label text-caption text-grey-7 gt-xs">Keep screen on</span>
            </div>
          </div>
        </div>

        <!-- Content: Ingredients + Steps -->
        <div class="sp-cook__content">
          <SectionCard title="Ingredients" class="q-mb-md">
            <IngredientsList
              :ingredients="selectedRecipe.ingredients || []"
              :checked-ingredients="checkedIngredients"
              :servings-multiplier="servingsMultiplier"
              :show-checkboxes="true"
              @toggle-ingredient="toggleIngredient"
            />
          </SectionCard>

          <SectionCard title="Steps">
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
          </SectionCard>
        </div>
      </div>

      <!-- No recipe selected -->
      <div v-else class="sp-cook sp-cook--empty">
        <PageHeader title="Cook" icon="soup_kitchen" />
        <EmptyState
          icon="soup_kitchen"
          title="No recipe selected"
          hint="Pick a recipe from the Recipes view to start cooking."
        >
          <template #action>
            <q-btn
              color="primary"
              label="Go to Recipes"
              icon="restaurant_menu"
              unelevated
              no-caps
              class="q-mt-md"
              @click="router.push('/recipes')"
            />
          </template>
        </EmptyState>
      </div>
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-cook {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.sp-cook--empty {
  display: flex;
  flex-direction: column;
}

/* Sticky controls bar below the header */
.sp-cook__controls-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sp-primary-soft);
  border-radius: var(--sp-r-md);
  padding: 10px 16px;
  border: 1px solid var(--sp-border);
  box-shadow: var(--sp-shadow-1);
}

.sp-cook__controls-inner {
  width: 100%;
}

.sp-cook__lock-label {
  font-size: 0.78rem;
}

/* Slightly larger checkboxes in cooking mode via :deep */
.sp-cook__content :deep(.q-checkbox__inner) {
  font-size: 1.25em;
}

/* Breathing room on mobile */
@media (max-width: 599px) {
  .sp-cook__controls-bar {
    border-radius: 8px;
    padding: 8px 12px;
  }
}
</style>
