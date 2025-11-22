<script setup lang="ts">
interface Props {
  servings: number
  originalServings?: number
  minServings?: number
}

const props = withDefaults(defineProps<Props>(), {
  minServings: 1
})

const emit = defineEmits<{
  'update:servings': [value: number]
  reset: []
}>()

const increment = () => {
  emit('update:servings', props.servings + 1)
}

const decrement = () => {
  if (props.servings > props.minServings) {
    emit('update:servings', props.servings - 1)
  }
}

const reset = () => {
  if (props.originalServings !== undefined) {
    emit('update:servings', props.originalServings)
    emit('reset')
  }
}
</script>

<template>
  <div class="servings-adjuster row items-center">
    <q-btn
      flat
      round
      dense
      icon="remove"
      color="primary"
      size="sm"
      @click="decrement"
      :disable="servings <= minServings"
    />
    <div class="servings-number q-mx-xs">{{ servings }}</div>
    <q-btn
      flat
      round
      dense
      icon="add"
      color="primary"
      size="sm"
      @click="increment"
    />
    <q-btn
      v-if="originalServings !== undefined && servings !== originalServings"
      flat
      dense
      round
      icon="refresh"
      color="grey-7"
      size="sm"
      @click="reset"
      class="q-ml-xs"
    >
      <q-tooltip>Reset to {{ originalServings }} servings</q-tooltip>
    </q-btn>
  </div>
</template>

<style scoped>
.servings-adjuster {
  flex-shrink: 0;
}

.servings-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--q-primary);
  min-width: 30px;
  text-align: center;
}
</style>
