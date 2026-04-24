<script setup lang="ts">
interface Props {
  icon?: string
  iconColor?: string
  title: string
  meta?: string
  clickable?: boolean
}

withDefaults(defineProps<Props>(), {
  icon: 'label',
  clickable: false
})

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="sp-list-card"
    :class="{ 'sp-list-card--clickable': clickable }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && $emit('click')"
    @keyup.enter="clickable && $emit('click')"
  >
    <div class="sp-list-card__icon">
      <q-icon :name="icon" :color="iconColor" size="20px" />
    </div>
    <div class="sp-list-card__body">
      <div class="sp-list-card__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="meta || $slots.meta" class="sp-list-card__meta">
        <slot name="meta">{{ meta }}</slot>
      </div>
    </div>
    <div class="sp-list-card__trailing">
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped>
.sp-list-card__trailing {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
