<script setup lang="ts">
interface Props {
  icon?: string
  label?: string
  color?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'add',
  color: 'primary',
  ariaLabel: 'Add'
})

defineEmits<{ click: [] }>()
</script>

<template>
  <q-btn
    fab
    :icon="icon"
    :color="color"
    :aria-label="ariaLabel"
    class="sp-fab"
    @click="$emit('click')"
  >
    <span v-if="label" class="q-ml-sm">{{ label }}</span>
  </q-btn>
</template>
