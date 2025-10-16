<script setup lang="ts">
export type ConfirmDialogType = 'warning' | 'danger' | 'info'

interface Props {
  modelValue: boolean
  title: string
  message: string
  type?: ConfirmDialogType
  confirmLabel?: string
  cancelLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const getConfirmColor = () => {
  switch (props.type) {
    case 'danger':
      return 'negative'
    case 'info':
      return 'primary'
    case 'warning':
    default:
      return 'orange'
  }
}

const getIcon = () => {
  switch (props.type) {
    case 'danger':
      return 'warning'
    case 'info':
      return 'info'
    case 'warning':
    default:
      return 'help'
  }
}

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
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon
          :name="getIcon()"
          :color="getConfirmColor()"
          size="32px"
          class="q-mr-md"
        />
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-body1" v-html="message"></div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="cancelLabel"
          color="grey-7"
          @click="handleCancel"
        />
        <q-btn
          flat
          :label="confirmLabel"
          :color="getConfirmColor()"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
