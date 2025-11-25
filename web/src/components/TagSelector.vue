<template>
  <div class="tag-selector">
    <q-select
      ref="selectRef"
      v-model="selectedTags"
      :options="filteredTagOptions"
      :label="label"
      multiple
      use-chips
      outlined
      dense
      use-input
      input-debounce="300"
      :loading="tagsStore.loading"
      :readonly="readonly"
      :disable="disable"
      @filter="filterTags"
      @update:model-value="emitUpdate"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            No tags found
          </q-item-section>
        </q-item>
        <template v-if="searchQuery">
          <q-separator />
          <q-item clickable @click="openCreateDialog">
            <q-item-section avatar>
              <q-icon name="add" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Create new tag</q-item-label>
              <q-item-label caption>Create "{{ searchQuery }}"</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps" clickable>
          <q-item-section side>
            <q-checkbox :model-value="scope.selected" @click.stop="scope.toggleOption" />
          </q-item-section>
          <q-item-section avatar v-if="scope.opt.icon">
            <span class="text-h6">{{ scope.opt.icon }}</span>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :style="{ backgroundColor: scope.opt.color }" />
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              dense
              round
              icon="edit"
              size="xs"
              color="grey-7"
              @click.stop="openEditDialog(scope.opt)"
            >
              <q-tooltip>Edit tag</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>

      <template #after-options>
        <q-separator />
        <q-item clickable @click="openCreateDialog">
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Create new tag</q-item-label>
            <q-item-label caption v-if="searchQuery">Create "{{ searchQuery }}"</q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #selected-item="{ opt }">
        <q-chip
          :removable="!readonly && !disable"
          dense
          :style="{
            backgroundColor: opt.color,
            color: getContrastColor(opt.color),
            padding: '6px 12px'
          }"
          @remove="removeTag(opt)"
        >
          <span v-if="opt.icon" style="margin-right: 6px">{{ opt.icon }}</span>
          <span>{{ opt.label }}</span>
        </q-chip>
      </template>
    </q-select>

    <!-- Create/Edit Tag Dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ dialogMode === 'create' ? 'Create New Tag' : 'Edit Tag' }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="tagForm.name"
            label="Tag Name"
            outlined
            dense
            autofocus
            @keyup.enter="saveTag"
          />

          <q-input
            v-model="tagForm.color"
            label="Color"
            outlined
            dense
            class="q-mt-md"
          >
            <template #append>
              <q-icon name="colorize" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="tagForm.color" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            v-model="tagForm.icon"
            label="Icon (emoji)"
            outlined
            dense
            maxlength="2"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="dialogMode === 'edit'"
            flat
            label="Delete"
            color="negative"
            @click="confirmDelete"
          />
          <q-space v-if="dialogMode === 'edit'" />
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            :label="dialogMode === 'create' ? 'Create' : 'Save'"
            color="primary"
            @click="saveTag"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Delete Tag"
      message="Are you sure you want to delete this tag? It will be removed from all items."
      type="danger"
      confirm-label="Delete"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTagsStore } from '@/stores/tagsStore'
import { useQuasar } from 'quasar'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

interface Props {
  modelValue: string[]
  label?: string
  readonly?: boolean
  disable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Tags',
  readonly: false,
  disable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const $q = useQuasar()
const tagsStore = useTagsStore()

const selectRef = ref<any>(null)
const selectedTags = ref<any[]>([])
const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingTagId = ref<string | null>(null)
const tagForm = ref({
  name: '',
  color: '#6200EA',
  icon: ''
})
const showDeleteDialog = ref(false)
const searchQuery = ref('')

const tagOptions = computed(() => {
  return tagsStore.sortedTagsWithRecent.map(tag => ({
    label: tag.name,
    value: tag._id!,
    color: tag.color || '#6200EA',
    icon: tag.icon
  }))
})

const filteredTagOptions = computed(() => {
  if (searchQuery.value === '') {
    return tagOptions.value
  } else {
    const needle = searchQuery.value.toLowerCase()
    return tagOptions.value.filter(opt =>
      opt.label.toLowerCase().includes(needle)
    )
  }
})

onMounted(async () => {
  if (tagsStore.tags.length === 0) {
    await tagsStore.fetchTags()
  }
  updateSelectedTags()
})

// Watch for changes in tagOptions to update selected tags
watch(tagOptions, () => {
  updateSelectedTags()
})

function updateSelectedTags() {
  selectedTags.value = tagOptions.value.filter(opt =>
    props.modelValue.includes(opt.value)
  )
}

function emitUpdate(selected: any[]) {
  const selectedIds = selected.map(s => s.value)
  emit('update:modelValue', selectedIds)

  // Mark these tags as recently used
  if (selectedIds.length > 0) {
    tagsStore.markTagsAsUsed(selectedIds)
  }
}

function removeTag(opt: any) {
  selectedTags.value = selectedTags.value.filter(t => t.value !== opt.value)
  emitUpdate(selectedTags.value)
}

function filterTags(val: string, update: (fn: () => void) => void) {
  update(() => {
    searchQuery.value = val
  })
}

function openCreateDialog() {
  dialogMode.value = 'create'
  editingTagId.value = null
  tagForm.value = {
    name: searchQuery.value || '',
    color: '#6200EA',
    icon: ''
  }
  showDialog.value = true
}

function openEditDialog(opt: any) {
  dialogMode.value = 'edit'
  editingTagId.value = opt.value
  tagForm.value = {
    name: opt.label,
    color: opt.color,
    icon: opt.icon || ''
  }
  showDialog.value = true
}

async function saveTag() {
  if (!tagForm.value.name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Tag name is required'
    })
    return
  }

  try {
    if (dialogMode.value === 'create') {
      const newTag = await tagsStore.createTag({
        name: tagForm.value.name.trim(),
        color: tagForm.value.color,
        icon: tagForm.value.icon.trim() || undefined
      })

      // Add the new tag to selection
      const newOption = {
        label: newTag.name,
        value: newTag._id!,
        color: newTag.color || '#6200EA',
        icon: newTag.icon
      }
      selectedTags.value.push(newOption)
      emitUpdate(selectedTags.value)

      // Clear the search query and reset the input field
      searchQuery.value = ''
      if (selectRef.value) {
        selectRef.value.updateInputValue('', true)
      }

      $q.notify({
        type: 'positive',
        message: 'Tag created successfully'
      })
    } else {
      // Edit mode
      await tagsStore.updateTag(editingTagId.value!, {
        name: tagForm.value.name.trim(),
        color: tagForm.value.color,
        icon: tagForm.value.icon.trim() || undefined
      })

      // Update the selected tags if this tag is selected
      updateSelectedTags()

      $q.notify({
        type: 'positive',
        message: 'Tag updated successfully'
      })
    }

    showDialog.value = false
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.body?.message || `Failed to ${dialogMode.value} tag`
    })
  }
}

function confirmDelete() {
  showDeleteDialog.value = true
}

async function handleDeleteConfirm() {
  try {
    await tagsStore.deleteTag(editingTagId.value!)

    // Remove from selected tags if it was selected
    selectedTags.value = selectedTags.value.filter(t => t.value !== editingTagId.value)
    emitUpdate(selectedTags.value)

    showDialog.value = false

    $q.notify({
      type: 'positive',
      message: 'Tag deleted successfully'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.body?.message || 'Failed to delete tag'
    })
  }
}

function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
</script>

<style scoped>
.tag-selector {
  width: 100%;
}
</style>
