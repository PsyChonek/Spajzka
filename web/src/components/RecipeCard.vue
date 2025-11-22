<script setup lang="ts">
import type { Recipe } from '@/stores/recipesStore'

interface Props {
  recipe: Recipe
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true
})

const emit = defineEmits<{
  click: [recipe: Recipe]
}>()

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.recipe)
  }
}
</script>

<template>
  <q-card
    class="recipe-card q-mb-md"
    :class="{ 'cursor-pointer': clickable }"
    @click="handleClick"
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
      <slot name="actions">
        <q-icon v-if="clickable" name="chevron_right" size="md" color="grey-6" />
      </slot>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.recipe-card {
  transition: all 0.2s ease;
}

.recipe-card.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recipe-icon {
  font-size: 3rem;
  line-height: 1;
}

/* Mobile responsive */
@media (max-width: 599px) {
  .recipe-icon {
    font-size: 2rem;
  }
}
</style>
