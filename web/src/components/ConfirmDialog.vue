<script setup lang="ts">
import { computed } from 'vue'
import BaseDialog from './BaseDialog.vue'

export type ConfirmDialogType = 'warning' | 'danger' | 'info'

interface Props {
  modelValue: boolean
  title: string
  message?: string
  type?: ConfirmDialogType
  confirmLabel?: string
  cancelLabel?: string
  /** Show a loading spinner on the confirm button (e.g. while a request is in-flight). */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  loading: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const confirmColor = computed(() => {
  switch (props.type) {
    case 'danger': return 'negative'
    case 'info': return 'primary'
    case 'warning':
    default: return 'warning'
  }
})

const headerIcon = computed(() => {
  switch (props.type) {
    case 'danger': return 'warning_amber'
    case 'info': return 'info'
    case 'warning':
    default: return 'help_outline'
  }
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="title"
    :header-icon="headerIcon"
    :header-icon-color="confirmColor"
    size="sm"
    persistent
    hide-close
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleCancel"
  >
    <p v-if="message" class="sp-confirm__message" v-html="message" />
    <slot />

    <template #footer>
      <q-btn
        flat
        no-caps
        :label="cancelLabel"
        color="grey-8"
        @click="handleCancel"
      />
      <q-btn
        unelevated
        no-caps
        :label="confirmLabel"
        :color="confirmColor"
        :loading="loading"
        text-color="white"
        @click="handleConfirm"
      />
    </template>
  </BaseDialog>
</template>

<style scoped>
.sp-confirm__message {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--sp-text);
  margin: 0;
}

.sp-confirm__message :deep(strong) {
  color: var(--sp-text);
  font-weight: 700;
}
</style>
