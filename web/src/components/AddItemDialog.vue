<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ItemFormData {
  name: string
  quantity?: number
  defaultUnit?: string
  category?: string
  icon?: string
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
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Add New Item',
  showPantryFields: false,
  readonlyItemFields: false,
  showGlobalToggle: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: ItemFormData): void
  (e: 'cancel'): void
}>()

// Form fields
const formName = ref('')
const formQuantity = ref<number | undefined>()
const formDefaultUnit = ref('pcs')
const formCategory = ref('')
const formIcon = ref('')
const formIsGlobal = ref(false)

// Watch for initial data changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    formName.value = newData.name || ''
    formQuantity.value = newData.quantity || undefined
    formDefaultUnit.value = newData.defaultUnit || 'pcs'
    formCategory.value = newData.category || ''
    formIcon.value = newData.icon || ''
    formIsGlobal.value = newData.isGlobal || false
  }
}, { immediate: true })

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
  formIsGlobal.value = false
}

const isFormValid = () => {
  if (!formName.value.trim()) return false
  if (!formDefaultUnit.value.trim()) return false
  return true
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Base fields (always shown) -->
        <q-input
          v-model="formName"
          outlined
          label="Item Name *"
          autofocus
          class="q-mb-md"
          @keyup.enter="handleSave"
        />

        <q-input
          v-model="formDefaultUnit"
          outlined
          label="Unit *"
          placeholder="e.g., kg, pcs, liter"
          class="q-mb-md"
        />

        <q-input
          v-model="formCategory"
          outlined
          label="Category"
          placeholder="e.g., Dairy, Vegetables"
          class="q-mb-md"
        />

        <q-input
          v-model="formIcon"
          outlined
          label="Icon (emoji)"
          placeholder="e.g., 🥛, 🥕, 🍎"
          class="q-mb-md"
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
            v-model.number="formQuantity"
            outlined
            label="Quantity"
            type="number"
            min="1"
          />
        </template>
      </q-card-section>

      <q-card-actions align="right">
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
