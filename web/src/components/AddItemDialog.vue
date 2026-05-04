<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { type QInput } from 'quasar'
import { useI18n } from 'vue-i18n'
import BaseDialog from './BaseDialog.vue'
import TagSelector from './TagSelector.vue'
import TranslationsDialog, { type TranslationsValue, type TranslatableField } from './TranslationsDialog.vue'
import { useAuthStore } from '@/stores/authStore'
import type { SupportedLocale } from '@/services/i18n'
import {
  allowedUnits,
  DEFAULT_UNIT_FOR_TYPE,
  UNIT_TYPE_OPTIONS,
  type UnitType,
} from '@shared/units'

export interface ItemFormData {
  name: string
  quantity?: number
  defaultUnit?: string
  unitType?: UnitType
  category?: string
  icon?: string
  searchNames?: string[]
  tags?: string[]
  isGlobal?: boolean
  translations?: TranslationsValue
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

const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const itemsLocale = computed<SupportedLocale>(() => (authStore.user?.itemsLanguage as SupportedLocale | undefined) ?? 'cs')

const formName = ref('')
const formQuantity = ref<number | undefined>()
const formDefaultUnit = ref('pcs')
const formUnitType = ref<UnitType>('count')
const formCategory = ref('')
const formIcon = ref('')
const formSearchNames = ref('')
const formTags = ref<string[]>([])
const formIsGlobal = ref(false)
const formTranslations = ref<TranslationsValue>({})
const showTranslationsDialog = ref(false)

const translationFields: TranslatableField[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  { key: 'searchNames', label: 'Search names', kind: 'list', placeholder: 'comma-separated' }
]

const unitOptions = computed(() => allowedUnits(formUnitType.value))

const handleUnitTypeChange = (next: UnitType) => {
  formUnitType.value = next
  if (next === 'custom') return
  if (!unitOptions.value.includes(formDefaultUnit.value)) {
    formDefaultUnit.value = DEFAULT_UNIT_FOR_TYPE[next]
  }
}

const nameInputRef = ref<QInput | null>(null)
const quantityInputRef = ref<QInput | null>(null)
const iconInputRef = ref<QInput | null>(null)
const unitInputRef = ref<{ focus: () => void } | null>(null)
const categoryInputRef = ref<QInput | null>(null)

watch(() => props.initialData, (newData) => {
  if (newData) {
    formName.value = newData.name || ''
    formQuantity.value = newData.quantity || undefined
    formUnitType.value = newData.unitType || 'count'
    formDefaultUnit.value = newData.defaultUnit || DEFAULT_UNIT_FOR_TYPE[formUnitType.value] || 'pcs'
    formCategory.value = newData.category || ''
    formIcon.value = newData.icon || ''
    formSearchNames.value = Array.isArray(newData.searchNames) ? newData.searchNames.join(', ') : ''
    formTags.value = newData.tags || []
    formIsGlobal.value = newData.isGlobal || false
    formTranslations.value = newData.translations ? JSON.parse(JSON.stringify(newData.translations)) : {}
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
    unitType: formUnitType.value,
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

  // Mirror the visible fields into the active items-locale slot so the
  // translations dialog and the main form stay consistent without watchers.
  const loc = itemsLocale.value
  const merged: TranslationsValue = { ...formTranslations.value }
  merged[loc] = { ...(merged[loc] ?? {}), name: data.name, searchNames: data.searchNames ?? [] }
  const hasAny = Object.values(merged).some(slot =>
    slot && Object.values(slot).some(v => (typeof v === 'string' ? v.trim() : Array.isArray(v) && v.length > 0))
  )
  if (hasAny) data.translations = merged

  emit('save', data)
  emit('update:modelValue', false)
  resetForm()
}

const openTranslationsDialog = () => {
  // Mirror the visible fields into the active items-locale slot so the dialog
  // shows what the user just typed instead of stale data.
  const loc = itemsLocale.value
  const next: TranslationsValue = { ...formTranslations.value }
  next[loc] = {
    ...(next[loc] ?? {}),
    name: formName.value,
    searchNames: formSearchNames.value.split(',').map(s => s.trim()).filter(Boolean)
  }
  formTranslations.value = next
  showTranslationsDialog.value = true
}

const handleTranslationsSave = (value: TranslationsValue) => {
  formTranslations.value = value
  const loc = itemsLocale.value
  const n = value[loc]?.name
  if (typeof n === 'string') formName.value = n
  const sn = value[loc]?.searchNames
  if (Array.isArray(sn)) formSearchNames.value = sn.join(', ')
}

const resetForm = () => {
  formName.value = ''
  formQuantity.value = 1
  formUnitType.value = 'count'
  formDefaultUnit.value = 'pcs'
  formCategory.value = ''
  formIcon.value = ''
  formTags.value = []
  formSearchNames.value = ''
  formIsGlobal.value = false
  formTranslations.value = {}
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
    <div class="row items-end no-wrap q-gutter-sm q-mb-md">
      <q-input
        ref="nameInputRef"
        v-model="formName"
        outlined
        :label="t('common.name') + ' *'"
        class="col"
        :readonly="readonlyItemFields"
        :disable="readonlyItemFields"
        @keyup.enter="handleSave"
      />
      <q-btn
        flat
        dense
        no-caps
        icon="translate"
        :label="t('common.translations')"
        :disable="readonlyItemFields"
        data-testid="open-translations-dialog"
        @click="openTranslationsDialog"
      />
    </div>

    <q-select
      :model-value="formUnitType"
      :options="UNIT_TYPE_OPTIONS"
      outlined
      label="Unit type *"
      emit-value
      map-options
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
      @update:model-value="handleUnitTypeChange"
    />

    <q-select
      v-if="formUnitType !== 'custom'"
      ref="unitInputRef"
      v-model="formDefaultUnit"
      :options="unitOptions"
      outlined
      label="Default unit *"
      class="q-mb-md"
      :readonly="readonlyItemFields"
      :disable="readonlyItemFields"
    />

    <q-input
      v-else
      ref="unitInputRef"
      v-model="formDefaultUnit"
      outlined
      label="Default unit *"
      placeholder="e.g. bottle, packet"
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

    <TranslationsDialog
      v-model="showTranslationsDialog"
      :fields="translationFields"
      :translations="formTranslations"
      @save="handleTranslationsSave"
    />

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

