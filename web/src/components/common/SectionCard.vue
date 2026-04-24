<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  flat?: boolean
}

withDefaults(defineProps<Props>(), {
  flat: false
})
</script>

<template>
  <section class="sp-section-card" :class="{ 'sp-section-card--flat': flat }">
    <header v-if="title || $slots.actions" class="sp-section-card__header">
      <div>
        <h2 v-if="title" class="sp-section-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="sp-section-card__subtitle">{{ subtitle }}</p>
      </div>
      <div class="sp-section-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="sp-section-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sp-section-card {
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  padding: 18px 18px;
  box-shadow: var(--sp-shadow-1);
  margin-bottom: 16px;
}

.sp-section-card--flat {
  box-shadow: none;
}

.sp-section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.sp-section-card__title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--sp-text);
  margin: 0;
}

.sp-section-card__subtitle {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  margin: 2px 0 0;
}

.sp-section-card__actions {
  display: flex;
  gap: 8px;
}
</style>
