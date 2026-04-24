<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title: string
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
  <header class="sp-page-header">
    <div class="sp-page-header__main">
      <div class="row items-center q-gutter-sm q-mb-xs">
        <q-btn
          v-if="back"
          flat
          dense
          round
          icon="arrow_back"
          aria-label="Back"
          @click="goBack"
        />
        <q-icon
          v-if="icon"
          :name="icon"
          size="28px"
          color="primary"
          class="sp-page-header__icon"
        />
        <h1 class="sp-page-header__title">{{ title }}</h1>
      </div>
      <p v-if="subtitle" class="sp-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="sp-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.sp-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.sp-page-header__main {
  flex: 1;
  min-width: 0;
}

.sp-page-header__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sp-page-header__icon {
  background: var(--sp-primary-soft);
  border-radius: 10px;
  padding: 6px;
  width: 40px;
  height: 40px;
}
</style>
