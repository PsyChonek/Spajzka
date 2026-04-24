<script setup lang="ts">
interface Props {
  /** Reserved for backwards compat — ignored by the new shell. */
  maxWidth?: string
  /** Reserved for backwards compat — ignored by the new shell. */
  minHeight?: string
  /** Reserved for backwards compat — ignored by the new shell. */
  padding?: string
  /** Reserved for backwards compat — ignored by the new shell. */
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
  <div class="sp-page sp-page--with-bottom-nav">
    <slot />
  </div>
</template>
