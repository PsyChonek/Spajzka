<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { RecipeIngredient } from '@shared/api-client'
import { useItemsStore } from '@/stores/itemsStore'
import { formatQuantity } from '@shared/units'

interface Props {
  ingredients: RecipeIngredient[]
  checkedIngredients?: Set<number>
  showCheckboxes?: boolean
  servingsMultiplier?: number
}

const props = withDefaults(defineProps<Props>(), {
  showCheckboxes: false,
  servingsMultiplier: 1
})

const emit = defineEmits<{
  toggleIngredient: [index: number]
}>()

const itemsStore = useItemsStore()

// Ensure items are loaded so itemId -> primary name resolution works on first render.
onMounted(() => {
  if (itemsStore.allItems.length === 0) itemsStore.fetchItems()
})

const itemNameById = computed(() => {
  const map = new Map<string, string>()
  for (const item of itemsStore.allItems) {
    if (item._id && item.name) map.set(item._id, item.name)
  }
  return map
})

const adjustedIngredients = computed(() => {
  return props.ingredients.map(ingredient => {
    const resolvedName = ingredient.itemId
      ? (itemNameById.value.get(ingredient.itemId) ?? ingredient.itemName)
      : ingredient.itemName
    return {
      ...ingredient,
      itemName: resolvedName,
      quantity: Number((ingredient.quantity * props.servingsMultiplier).toFixed(2))
    }
  })
})

const handleToggle = (index: number) => {
  emit('toggleIngredient', index)
}
</script>

<template>
  <div class="ingredients-list">
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
        :clickable="showCheckboxes"
        @click="showCheckboxes ? handleToggle(index) : null"
      >
        <q-item-section v-if="showCheckboxes" avatar>
          <q-checkbox
            :model-value="checkedIngredients?.has(index)"
            @update:model-value="handleToggle(index)"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-strike': showCheckboxes && checkedIngredients?.has(index) }">
            {{ ingredient.itemName }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label caption>
            {{ formatQuantity(ingredient.quantity, ingredient.unit, { promote: true }) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped>
.section-title {
  font-weight: 600;
  color: var(--q-primary);
}

.ingredients-list {
  animation: fadeIn 0.3s ease;
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
</style>
