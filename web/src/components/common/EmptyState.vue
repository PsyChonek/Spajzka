<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  hint?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'inbox'
})
</script>

<template>
  <div class="sp-empty">
    <q-icon :name="icon" class="sp-empty__icon" />
    <div class="sp-empty__title">{{ title }}</div>
    <div v-if="hint" class="sp-empty__hint">{{ hint }}</div>
    <slot name="action" />
  </div>
</template>
