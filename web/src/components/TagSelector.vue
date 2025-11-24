<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tagsStore'
import { useQuasar } from 'quasar'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SearchSelect from '@/components/SearchSelect.vue'

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

const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingTagId = ref<string | null>(null)
const tagForm = ref({
  name: '',
  color: '#6200EA',
  icon: ''
})
const showDeleteDialog = ref(false)

const tagOptions = computed(() => {
  return tagsStore.sortedTagsWithRecent.map(tag => ({
    label: tag.name,
    name: tag.name, // For SearchSelect optionLabel
    value: tag._id!,
    color: tag.color || '#6200EA',
    icon: tag.icon
  }))
})

onMounted(async () => {
  if (tagsStore.tags.length === 0) {
    await tagsStore.fetchTags()
  }
})

function handleUpdate(selectedTagValues: string[]) {
  emit('update:modelValue', selectedTagValues)

  // Mark these tags as recently used
  if (selectedTagValues.length > 0) {
    tagsStore.markTagsAsUsed(selectedTagValues)
  }
}

function openCreateDialog(searchValue: string) {
  dialogMode.value = 'create'
  editingTagId.value = null
  tagForm.value = {
    name: searchValue || '',
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
      if (newTag._id) {
        const updatedSelection = [...props.modelValue, newTag._id]
        emit('update:modelValue', updatedSelection)
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
    const updatedSelection = props.modelValue.filter(id => id !== editingTagId.value)
    emit('update:modelValue', updatedSelection)

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
</script>

<template>
  <div class="tag-selector">
    <SearchSelect
      :model-value="modelValue"
      :options="tagOptions"
      :label="label"
      :loading="tagsStore.loading"
      :readonly="readonly"
      :disable="disable"
      option-label="name"
      option-value="value"
      multiple
      use-chips
      dense
      show-icon
      icon-field="icon"
      chip-color-field="color"
      chip-icon-field="icon"
      show-side-info
      side-info-field="color"
      show-add-option
      add-option-label="Create new tag"
      :add-option-caption="(search: string) => search ? `Create &quot;${search}&quot;` : ''"
      return-object
      @update:model-value="handleUpdate"
      @add-new="openCreateDialog"
      @edit="openEditDialog"
    />

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

<style scoped>
.tag-selector {
  width: 100%;
}
</style>
