<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, useAttrs } from 'vue'

const attrs = useAttrs()

// Menu props to control positioning
const menuProps = {
  fit: false,
  'max-width': '100vw',
  class: 'full-width-menu'
}

interface Props {
  modelValue: T | T[] | string | string[] | null
  options: T[]
  label?: string
  placeholder?: string
  loading?: boolean
  readonly?: boolean
  disable?: boolean
  dense?: boolean
  // Multiple selection
  multiple?: boolean
  useChips?: boolean
  // Display options
  optionLabel?: string | ((opt: T) => string)
  optionValue?: string | ((opt: T) => any)
  showIcon?: boolean
  iconField?: string
  showSubLabel?: boolean
  subLabelField?: string
  showSideInfo?: boolean
  sideInfoField?: string
  // Add new functionality
  showAddOption?: boolean
  addOptionLabel?: string
  addOptionCaption?: (searchValue: string) => string
  // Behavior
  returnObject?: boolean
  clearable?: boolean
  // Custom styling for chips (for tags)
  chipColorField?: string
  chipIconField?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Start typing to search...',
  loading: false,
  readonly: false,
  disable: false,
  dense: false,
  multiple: false,
  useChips: false,
  optionLabel: 'name',
  showIcon: false,
  iconField: 'icon',
  showSubLabel: false,
  subLabelField: 'category',
  showSideInfo: false,
  sideInfoField: 'defaultUnit',
  showAddOption: false,
  addOptionLabel: 'Add new',
  returnObject: false,
  clearable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'add-new': [searchValue: string]
  'edit': [item: T]
}>()

// Local state
const localValue = ref<any>(null)
const filteredOptions = ref<T[]>([])
const searchValue = ref('')

// Helper to get option label
const getOptionLabel = (opt: T): string => {
  if (typeof props.optionLabel === 'function') {
    return props.optionLabel(opt)
  }
  return opt[props.optionLabel] as string
}

// Helper to get option value
const getOptionValue = (opt: T): any => {
  if (props.optionValue) {
    if (typeof props.optionValue === 'function') {
      return props.optionValue(opt)
    }
    return opt[props.optionValue]
  }
  return opt
}

// Initialize local value from modelValue
watch(() => props.modelValue, (newVal) => {
  if (props.multiple) {
    // Handle multiple selection
    if (Array.isArray(newVal)) {
      if (newVal.length === 0) {
        localValue.value = []
      } else if (typeof newVal[0] === 'string') {
        // Array of strings - find matching options
        localValue.value = props.options.filter(opt => {
          const label = getOptionLabel(opt)
          const value = getOptionValue(opt)
          return newVal.includes(label as any) || newVal.includes(value as any)
        })
      } else {
        localValue.value = newVal
      }
    } else {
      localValue.value = []
    }
  } else {
    // Handle single selection
    if (typeof newVal === 'string') {
      const found = props.options.find(opt => getOptionLabel(opt) === newVal)
      localValue.value = found || newVal
    } else {
      localValue.value = newVal
    }
  }
}, { immediate: true, deep: true })

// Watch options to update filtered list
watch(() => props.options, () => {
  if (!searchValue.value) {
    filteredOptions.value = props.options.slice(0, 20)
  }
}, { immediate: true })

// Display value for q-select
const displayValue = computed(() => {
  if (props.multiple) {
    if (!Array.isArray(localValue.value)) return []
    return localValue.value
  } else {
    if (!localValue.value) return ''
    if (typeof localValue.value === 'string') return localValue.value
    return getOptionLabel(localValue.value)
  }
})

const handleFilter = (val: string, update: any) => {
  searchValue.value = val

  update(() => {
    if (val === '') {
      filteredOptions.value = props.options.slice(0, 20)
    } else {
      const needle = val.toLowerCase()
      filteredOptions.value = props.options
        .filter(item => getOptionLabel(item).toLowerCase().includes(needle))
        .slice(0, 20)
    }
  })
}

const handleUpdate = (val: any) => {
  localValue.value = val

  if (props.multiple) {
    // Handle multiple selection
    if (!Array.isArray(val)) {
      emit('update:modelValue', [])
      return
    }

    if (props.returnObject) {
      emit('update:modelValue', val)
    } else {
      emit('update:modelValue', val.map((v: any) => getOptionValue(v)))
    }
  } else {
    // Handle single selection
    if (props.returnObject) {
      emit('update:modelValue', val)
    } else {
      if (!val) {
        emit('update:modelValue', null)
      } else if (typeof val === 'string') {
        emit('update:modelValue', val)
      } else {
        emit('update:modelValue', getOptionLabel(val))
      }
    }
  }
}

const handleAddNew = () => {
  emit('add-new', searchValue.value)
}

const handleEdit = (opt: T) => {
  emit('edit', opt)
}

const handleRemoveChip = (opt: any) => {
  if (Array.isArray(localValue.value)) {
    localValue.value = localValue.value.filter(v => v !== opt)
    handleUpdate(localValue.value)
  }
}

// For contrast color calculation (for tags)
const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// Expose select ref and methods
const selectRef = ref<any>(null)

defineExpose({
  selectRef,
  hidePopup: () => selectRef.value?.hidePopup(),
  showPopup: () => selectRef.value?.showPopup()
})
</script>

<template>
  <q-select
    ref="selectRef"
    :model-value="displayValue"
    :options="filteredOptions"
    :label="label"
    :placeholder="placeholder"
    :loading="loading"
    :readonly="readonly"
    :disable="disable"
    :dense="dense"
    :clearable="clearable"
    :multiple="multiple"
    :use-chips="useChips"
    outlined
    use-input
    input-debounce="300"
    :option-label="optionLabel"
    fill-input
    hide-selected
    :menu-props="menuProps"
    class="search-select-field"
    menu-class="search-select-menu"
    @filter="handleFilter"
    @update:model-value="handleUpdate"
  >
    <!-- Custom option display -->
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps" clickable>
        <!-- Checkbox for multiple select -->
        <q-item-section v-if="multiple" side>
          <q-checkbox
            :model-value="scope.selected"
            @update:model-value="scope.toggleOption(scope.opt)"
          />
        </q-item-section>

        <!-- Icon -->
        <q-item-section v-if="showIcon" avatar>
          <span class="text-h6">{{ scope.opt[iconField] || '📦' }}</span>
        </q-item-section>

        <!-- Label and sub-label -->
        <q-item-section>
          <q-item-label>{{ getOptionLabel(scope.opt) }}</q-item-label>
          <q-item-label v-if="showSubLabel && scope.opt[subLabelField]" caption>
            {{ scope.opt[subLabelField] }}
          </q-item-label>
        </q-item-section>

        <!-- Side info (like unit or color badge) -->
        <q-item-section v-if="showSideInfo && scope.opt[sideInfoField]" side>
          <q-item-label caption class="text-weight-medium">
            {{ scope.opt[sideInfoField] }}
          </q-item-label>
        </q-item-section>

        <!-- Color badge (for tags) -->
        <q-item-section v-if="chipColorField && scope.opt[chipColorField]" side>
          <q-badge :style="{ backgroundColor: scope.opt[chipColorField] }" />
        </q-item-section>

        <!-- Edit button -->
        <q-item-section v-if="attrs.onEdit" side>
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="xs"
            color="grey-7"
            @click.stop="handleEdit(scope.opt)"
          >
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </template>

    <!-- Add new option at the bottom of results -->
    <template v-if="showAddOption" v-slot:after-options>
      <template v-if="searchValue">
        <q-separator />
        <q-item clickable @click="handleAddNew">
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ addOptionLabel }}</q-item-label>
            <q-item-label v-if="addOptionCaption" caption>
              {{ addOptionCaption(searchValue) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </template>

    <!-- No options state with optional add button -->
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No items found
        </q-item-section>
      </q-item>
      <template v-if="showAddOption && searchValue">
        <q-separator />
        <q-item clickable @click="handleAddNew">
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ addOptionLabel }}</q-item-label>
            <q-item-label v-if="addOptionCaption" caption>
              {{ addOptionCaption(searchValue) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </template>

    <!-- Custom chip display (for tags with colors) -->
    <template v-if="useChips && chipColorField" v-slot:selected-item="{ opt }">
      <q-chip
        :removable="!readonly && !disable"
        dense
        :style="{
          backgroundColor: opt[chipColorField],
          color: getContrastColor(opt[chipColorField]),
          padding: '6px 12px'
        }"
        @remove="handleRemoveChip(opt)"
      >
        <span v-if="chipIconField && opt[chipIconField]" style="margin-right: 6px">
          {{ opt[chipIconField] }}
        </span>
        <span>{{ getOptionLabel(opt) }}</span>
      </q-chip>
    </template>

    <!-- Pass through slots -->
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" v-slot:append>
      <slot name="append" />
    </template>
  </q-select>
</template>

<style scoped>
/* Ensure full width */
.search-select-field {
  width: 100% !important;
  max-width: 100% !important;
}

.search-select-field :deep(.q-field__inner) {
  width: 100% !important;
}

.search-select-field :deep(.q-field__control) {
  width: 100% !important;
}
</style>

<style>
/* Force dropdown menu to use full viewport width */
.search-select-menu.q-menu,
.full-width-menu.q-menu {
  max-width: 100vw !important;
  width: 100vw !important;
}

/* Try to override Quasar's inline positioning */
.search-select-menu.q-menu[style],
.full-width-menu.q-menu[style] {
  left: 0 !important;
  right: 0 !important;
  width: 100vw !important;
}

.search-select-menu .q-virtual-scroll__content {
  width: 100%;
}

.search-select-menu .q-item {
  min-height: 44px; /* Better touch target */
}

/* Ensure chips wrap nicely */
.search-select-field .q-field__control .q-field__control-container {
  flex-wrap: wrap;
}

/* Better spacing for options */
.search-select-menu .q-item__section--avatar {
  min-width: 40px;
}

.search-select-menu .q-item__section--side {
  padding-left: 8px;
}
</style>
