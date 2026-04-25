<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { type QInput } from 'quasar'
import BaseDialog from './BaseDialog.vue'
import TagSelector from './TagSelector.vue'

export interface ItemFormData {
  name: string
  quantity?: number
  defaultUnit?: string
  category?: string
  icon?: string
  searchNames?: string[]
  tags?: string[]
  isGlobal?: boolean
}

interface Props {
  modelValue: boolean
  title?: string
  initialData?: Partial<ItemFormData>
  showPantryFields?: boolean
  readonlyItemFields?: boolean
  showGlobalToggle?: boolean
  focusField?: 'name' | 'quantity' | 'icon' | 'unit' | 'category'
  showDeleteButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Add New Item',
  showPantryFields: false,
  readonlyItemFields: false,
  showGlobalToggle: false,
  focusField: 'name',
  showDeleteButton: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: ItemFormData): void
  (e: 'cancel'): void
  (e: 'delete'): void
}>()

const formName = ref('')
const formQuantity = ref<number | undefined>()
const formDefaultUnit = ref('pcs')
const formCategory = ref('')
const formIcon = ref('')
const formSearchNames = ref('')
const formTags = ref<string[]>([])
const formIsGlobal = ref(false)

const nameInputRef = ref<QInput | null>(null)
const quantityInputRef = ref<QInput | null>(null)
const iconInputRef = ref<QInput | null>(null)
const unitInputRef = ref<QInput | null>(null)
const categoryInputRef = ref<QInput | null>(null)

watch(() => props.initialData, (newData) => {
  if (newData) {
    formName.value = newData.name || ''
    formQuantity.value = newData.quantity || undefined
    formDefaultUnit.value = newData.defaultUnit || 'pcs'
    formCategory.value = newData.category || ''
    formIcon.value = newData.icon || ''
    formSearchNames.value = Array.isArray(newData.searchNames) ? newData.searchNames.join(', ') : ''
    formTags.value = newData.tags || []
    formIsGlobal.value = newData.isGlobal || false
  }
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) return
  nextTick(() => {
    const focusMap = {
      name: nameInputRef,
      quantity: quantityInputRef,
      icon: iconInputRef,
      unit: unitInputRef,
      category: categoryInputRef
    }
    const targetRef = focusMap[props.focusField]
    if (targetRef?.value) targetRef.value.focus()
  })
})

const handleClose = () => {
  emit('update:modelValue', false)
  emit('cancel')
  resetForm()
}

const handleSave = () => {
  const data: ItemFormData = {
    name: formName.value.trim(),
    defaultUnit: formDefaultUnit.value.trim(),
    category: formCategory.value.trim() || undefined,
    icon: formIcon.value.trim() || undefined
  }

  if (formSearchNames.value.trim()) {
    data.searchNames = formSearchNames.value
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  if (props.showPantryFields) data.quantity = formQuantity.value
  if (props.showGlobalToggle) data.isGlobal = formIsGlobal.value
  data.tags = formTags.value

  emit('save', data)
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formName.value = ''
  formQuantity.value = 1
  formDefaultUnit.value = 'pcs'
  formCategory.value = ''
  formIcon.value = ''
  formTags.value = []
  formSearchNames.value = ''
  formIsGlobal.value = false
}

const isFormValid = () => {
  if (!formName.value.trim()) return false
  if (!formDefaultUnit.value.trim()) return false
  return true
}

const handleDelete = () => {
  emit('delete')
  emit('update:modelValue', false)
  resetForm()
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <q-input
      ref="nameInputRef"
      v-model="formName"
      outlined
      label="Item name *"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
      @keyup.enter="handleSave"
    />

    <q-input
      ref="unitInputRef"
      v-model="formDefaultUnit"
      outlined
      label="Unit *"
      placeholder="e.g. kg, pcs, liter"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
    />

    <q-input
      ref="categoryInputRef"
      v-model="formCategory"
      outlined
      label="Category"
      placeholder="e.g. Dairy, Vegetables"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
    />

    <q-input
      ref="iconInputRef"
      v-model="formIcon"
      outlined
      label="Icon (emoji)"
      placeholder="📦"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
    />

    <q-input
      v-model="formSearchNames"
      outlined
      label="Additional search names"
      placeholder="e.g. tomato, tomate, rajčica"
      hint="Comma-separated alternative names for search"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
    />

    <TagSelector
      v-model="formTags"
      label="Tags"
      class="q-mb-md"
      :readonly="readonlyItemFields"
    />

    <q-toggle
      v-if="showGlobalToggle"
      v-model="formIsGlobal"
      label="Add as global item"
      color="primary"
      class="q-mb-md"
    >
      <q-tooltip>
        Global items are visible to all users and can only be managed by moderators
      </q-tooltip>
    </q-toggle>

    <template v-if="showPantryFields">
      <q-separator class="q-my-md" />
      <div class="sp-form-label">Pantry information</div>
      <q-input
        ref="quantityInputRef"
        v-model.number="formQuantity"
        outlined
        label="Quantity"
        type="number"
        min="1"
      />
    </template>

    <template #footer>
      <q-btn
        v-if="showDeleteButton"
        flat
        no-caps
        label="Delete"
        color="negative"
        icon="delete"
        class="sp-dlg-footer__leading"
        @click="handleDelete"
      />
      <q-btn flat no-caps label="Cancel" color="grey-8" @click="handleClose" />
      <q-btn
        unelevated
        no-caps
        label="Save"
        color="primary"
        :disable="!isFormValid()"
        @click="handleSave"
      />
    </template>
  </BaseDialog>
</template>

