<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useBackButton } from '@/composables/useBackButton'

export type BaseDialogSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  headerIcon?: string
  headerIconColor?: string
  size?: BaseDialogSize
  persistent?: boolean
  /** Hide the default close (X) button in the header */
  hideClose?: boolean
  /** Center the header content (icon stacks above title). */
  centerHeader?: boolean
  /** Disable the back-button hijack — useful when nested in another dialog. */
  noBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  persistent: false,
  hideClose: false,
  centerHeader: false,
  noBackButton: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const $q = useQuasar()

const maxWidth = computed(() => {
  switch (props.size) {
    case 'sm': return '420px'
    case 'md': return '520px'
    case 'lg': return '640px'
    case 'xl': return '800px'
  }
})

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

// Back button — opt-out via prop (e.g., for nested confirm dialogs).
const { pushHistoryState, removeHistoryState } = useBackButton(
  () => props.modelValue && !props.noBackButton,
  handleClose
)

watch(() => props.modelValue, (isOpen) => {
  if (props.noBackButton) return
  if (isOpen) pushHistoryState()
  else removeHistoryState()
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    :full-width="$q.screen.lt.sm"
    :maximized="$q.screen.lt.sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="sp-dlg" :style="$q.screen.lt.sm ? '' : `width: 100%; max-width: ${maxWidth}`">
      <!-- Header -->
      <header class="sp-dlg__header" :class="{ 'sp-dlg__header--center': centerHeader }">
        <slot name="header">
          <div class="sp-dlg__header-main">
            <q-icon
              v-if="headerIcon"
              :name="headerIcon"
              :color="headerIconColor || 'primary'"
              :size="centerHeader ? '40px' : '28px'"
              class="sp-dlg__header-icon"
            />
            <div class="sp-dlg__header-text">
              <h2 v-if="title" class="sp-dlg__title">{{ title }}</h2>
              <p v-if="subtitle" class="sp-dlg__subtitle">{{ subtitle }}</p>
            </div>
          </div>
        </slot>
        <q-btn
          v-if="!hideClose"
          flat
          dense
          round
          icon="close"
          aria-label="Close dialog"
          class="sp-dlg__close"
          @click="handleClose"
        />
      </header>

      <!-- Body -->
      <div class="sp-dlg__body">
        <slot />
      </div>

      <!-- Footer -->
      <footer v-if="$slots.footer" class="sp-dlg__footer">
        <slot name="footer" :close="handleClose" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.sp-dlg {
  display: flex;
  flex-direction: column;
  background: var(--sp-surface);
  border-radius: var(--sp-r-lg);
  overflow: hidden;
}

@media (max-width: 599px) {
  .sp-dlg {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh;
    max-height: 100vh !important;
    border-radius: 0;
  }
}

.sp-dlg__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--sp-divider);
  flex-shrink: 0;
}

.sp-dlg__header--center {
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 24px 16px;
  border-bottom: none;
}

.sp-dlg__header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.sp-dlg__header--center .sp-dlg__header-main {
  flex-direction: column;
  gap: 8px;
}

.sp-dlg__header-icon {
  flex-shrink: 0;
}

.sp-dlg__header-text {
  flex: 1;
  min-width: 0;
}

.sp-dlg__title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--sp-text);
  margin: 0;
}

.sp-dlg__header--center .sp-dlg__title {
  font-size: 1.3rem;
}

.sp-dlg__subtitle {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  margin: 4px 0 0;
  line-height: 1.4;
}

.sp-dlg__close {
  margin: -4px -4px 0 0;
  color: var(--sp-text-muted);
}

.sp-dlg__body {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

@media (max-width: 599px) {
  .sp-dlg__body {
    flex: 1;
  }
}

.sp-dlg__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--sp-divider);
  background: var(--sp-surface);
  flex-shrink: 0;
  flex-wrap: wrap;
}

@media (max-width: 599px) {
  .sp-dlg__footer {
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
