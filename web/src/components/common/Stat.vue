<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  icon?: string
  color?: string
  to?: string
}

withDefaults(defineProps<Props>(), {
  color: 'primary'
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="sp-stat"
    :class="{ 'sp-stat--clickable': to }"
  >
    <div class="row items-center justify-between">
      <span class="sp-stat__label">{{ label }}</span>
      <q-icon v-if="icon" :name="icon" :color="color" size="20px" />
    </div>
    <div class="sp-stat__value">{{ value }}</div>
    <div v-if="$slots.default" class="sp-stat__hint">
      <slot />
    </div>
  </component>
</template>

<style scoped>
.sp-stat {
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.sp-stat--clickable {
  cursor: pointer;
}

.sp-stat--clickable:hover {
  box-shadow: var(--sp-shadow-2);
  border-color: rgba(47, 125, 95, 0.3);
}

.sp-stat__hint {
  font-size: 0.8rem;
  color: var(--sp-text-muted);
  margin-top: 2px;
}
</style>
