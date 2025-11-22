<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { QInput } from 'quasar'

export interface ItemFormData {
  name: string
  quantity?: number
  defaultUnit?: string
  category?: string
  icon?: string
  searchNames?: string[]
  isGlobal?: boolean
}

interface Props {
  modelValue: boolean
  title?: string
  initialData?: Partial<ItemFormData>
  // Show separator and extra fields for pantry-specific data
  showPantryFields?: boolean
  // Make item fields read-only (for editing pantry items where only quantity can change)
  readonlyItemFields?: boolean
  // Show global item toggle (when user has permission)
  showGlobalToggle?: boolean
  // Field to focus when dialog opens: 'name', 'quantity', 'icon', or default
  focusField?: 'name' | 'quantity' | 'icon' | 'unit' | 'category'
  // Show delete button (for editing existing items)
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

// Form fields
const formName = ref('')
const formQuantity = ref<number | undefined>()
const formDefaultUnit = ref('pcs')
const formCategory = ref('')
const formIcon = ref('')
const formSearchNames = ref('')
const formIsGlobal = ref(false)

// Input refs for focusing
const nameInputRef = ref<QInput | null>(null)
const quantityInputRef = ref<QInput | null>(null)
const iconInputRef = ref<QInput | null>(null)
const unitInputRef = ref<QInput | null>(null)
const categoryInputRef = ref<QInput | null>(null)

// Watch for initial data changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    formName.value = newData.name || ''
    formQuantity.value = newData.quantity || undefined
    formDefaultUnit.value = newData.defaultUnit || 'pcs'
    formCategory.value = newData.category || ''
    formIcon.value = newData.icon || ''
    formSearchNames.value = Array.isArray(newData.searchNames) ? newData.searchNames.join(', ') : ''
    formIsGlobal.value = newData.isGlobal || false
  }
}, { immediate: true })

// Watch for dialog opening to focus the correct field
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const focusMap = {
        name: nameInputRef,
        quantity: quantityInputRef,
        icon: iconInputRef,
        unit: unitInputRef,
        category: categoryInputRef
      }

      const targetRef = focusMap[props.focusField]
      if (targetRef?.value) {
        targetRef.value.focus()
      }
    })
  }
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

  // Parse searchNames from comma-separated string
  if (formSearchNames.value.trim()) {
    data.searchNames = formSearchNames.value
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  // Include quantity only if pantry fields are shown
  if (props.showPantryFields) {
    data.quantity = formQuantity.value
  }

  // Include isGlobal if toggle is shown
  if (props.showGlobalToggle) {
    data.isGlobal = formIsGlobal.value
  }

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
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="width: 100%; max-width: 400px">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Base fields (always shown) -->
        <q-input
          ref="nameInputRef"
          v-model="formName"
          outlined
          label="Item Name *"
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
          placeholder="e.g., kg, pcs, liter"
          class="q-mb-md"
          :readonly="readonlyItemFields"
          :disable="readonlyItemFields"
        />

        <q-input
          ref="categoryInputRef"
          v-model="formCategory"
          outlined
          label="Category"
          placeholder="e.g., Dairy, Vegetables"
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
          label="Additional Search Names"
          placeholder="e.g., tomato, tomate, rajčica"
          hint="Comma-separated alternative names for search"
          class="q-mb-md"
          :readonly="readonlyItemFields"
          :disable="readonlyItemFields"
        />

        <!-- Global item toggle -->
        <template v-if="showGlobalToggle">
          <q-toggle
            v-model="formIsGlobal"
            label="Add as Global Item"
            color="primary"
            class="q-mb-md"
          >
            <q-tooltip>
              Global items are visible to all users and can only be managed by moderators
            </q-tooltip>
          </q-toggle>
        </template>

        <!-- Separator and pantry-specific fields -->
        <template v-if="showPantryFields">
          <q-separator class="q-my-md" />

          <div class="text-subtitle2 text-grey-7 q-mb-sm">Pantry Information</div>

          <q-input
            ref="quantityInputRef"
            v-model.number="formQuantity"
            outlined
            label="Quantity"
            type="number"
            min="1"
          />
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="showDeleteButton"
          flat
          label="Delete"
          color="negative"
          icon="delete"
          @click="handleDelete"
          class="q-mr-auto"
        />
        <q-btn flat label="Cancel" color="primary" @click="handleClose" />
        <q-btn
          label="Save"
          color="primary"
          @click="handleSave"
          :disable="!isFormValid()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
