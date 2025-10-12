<script setup lang="ts">
interface Props {
  maxWidth?: string
  minHeight?: string
  padding?: string
  centered?: boolean
}

withDefaults(defineProps<Props>(), {
  maxWidth: '1200px',
  minHeight: '80vh',
  padding: 'md',
  centered: false
})
</script>

<template>
  <div
    class="page-wrapper"
    :class="[
      `q-pa-${padding}`,
      { 'page-wrapper--centered': centered }
    ]"
    :style="{
      maxWidth,
      minHeight
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.page-wrapper {
  margin: 0 auto;
}

.page-wrapper--centered {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
