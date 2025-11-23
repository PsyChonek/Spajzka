<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Search items...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'add': []
}>()

const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <q-input
    v-model="searchValue"
    outlined
    :placeholder="placeholder"
    class="search-input"
    clearable
  >
    <template v-slot:prepend>
      <q-icon name="search" />
    </template>
    <template v-slot:append>
      <q-btn
        round
        dense
        flat
        icon="add"
        color="primary"
        @click="emit('add')"
      />
    </template>
  </q-input>
</template>

<style scoped>
.search-input {
  width: 100%;
  max-width: 800px;
  font-size: 1.2rem;
}

.search-input :deep(.q-field__control) {
  height: 60px;
}
</style>
