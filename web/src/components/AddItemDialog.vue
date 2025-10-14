<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ItemFormData {
  name: string
  quantity?: number
  unit?: string
  category?: string
}

interface Props {
  modelValue: boolean
  title?: string
  initialData?: Partial<ItemFormData>
  fields?: {
    name?: boolean
    quantity?: boolean
    unit?: boolean
    category?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Add New Item',
  fields: () => ({
    name: true,
    quantity: false,
    unit: false,
    category: false
  })
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: ItemFormData): void
  (e: 'cancel'): void
}>()

// Form fields
const formName = ref('')
const formQuantity = ref(1)
const formUnit = ref('pcs')
const formCategory = ref('')

// Watch for initial data changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    formName.value = newData.name || ''
    formQuantity.value = newData.quantity || 1
    formUnit.value = newData.unit || 'pcs'
    formCategory.value = newData.category || ''
  }
}, { immediate: true, deep: true })

const handleClose = () => {
  emit('update:modelValue', false)
  emit('cancel')
  resetForm()
}

const handleSave = () => {
  const data: ItemFormData = {
    name: formName.value.trim()
  }

  if (props.fields?.quantity) {
    data.quantity = formQuantity.value
  }

  if (props.fields?.unit) {
    data.unit = formUnit.value.trim()
  }

  if (props.fields?.category) {
    data.category = formCategory.value.trim() || undefined
  }

  emit('save', data)
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formName.value = ''
  formQuantity.value = 1
  formUnit.value = 'pcs'
  formCategory.value = ''
}

const isFormValid = () => {
  if (!formName.value.trim()) return false
  if (props.fields?.unit && !formUnit.value.trim()) return false
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
        <!-- Name field (always shown) -->
        <q-input
          v-model="formName"
          outlined
          :label="fields?.unit ? 'Item Name *' : 'Item Name'"
          autofocus
          class="q-mb-md"
          @keyup.enter="handleSave"
        />

        <!-- Unit field -->
        <q-input
          v-if="fields?.unit"
          v-model="formUnit"
          outlined
          label="Unit *"
          placeholder="e.g., kg, pcs, liter"
          class="q-mb-md"
        />

        <!-- Category field -->
        <q-input
          v-if="fields?.category"
          v-model="formCategory"
          outlined
          label="Category"
          placeholder="e.g., Dairy, Vegetables"
          class="q-mb-md"
        />

        <!-- Quantity field -->
        <q-input
          v-if="fields?.quantity"
          v-model.number="formQuantity"
          outlined
          label="Quantity"
          type="number"
          min="1"
        />
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
