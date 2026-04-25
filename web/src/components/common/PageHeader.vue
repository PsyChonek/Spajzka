<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  subtitle?: string
  back?: boolean | string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  back: false
})

const router = useRouter()

const goBack = () => {
  if (typeof props.back === 'string') {
    router.push(props.back)
  } else {
    router.back()
  }
}
</script>

<template>
  <header v-if="back || subtitle || $slots.actions" class="sp-page-header">
    <div class="sp-page-header__main">
      <q-btn
        v-if="back"
        flat
        dense
        round
        icon="arrow_back"
        aria-label="Back"
        class="sp-page-header__back"
        @click="goBack"
      />
      <p v-if="subtitle" class="sp-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="sp-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.sp-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.sp-page-header__main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.sp-page-header__back {
  flex-shrink: 0;
  margin-left: -8px;
}

.sp-page-header__subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  line-height: 1.3;
  min-width: 0;
}

.sp-page-header__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
