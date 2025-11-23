<template>
  <div class="tag-selector">
    <q-select
      v-model="selectedTags"
      :options="tagOptions"
      :label="label"
      multiple
      use-chips
      outlined
      dense
      :loading="tagsStore.loading"
      :readonly="readonly"
      :disable="disable"
      @update:model-value="emitUpdate"
    >
      <template #option="{ opt, selected, toggleOption }">
        <q-item clickable @click="toggleOption(opt)">
          <q-item-section side>
            <q-checkbox :model-value="selected" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <span v-if="opt.icon">{{ opt.icon }} </span>
              {{ opt.label }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :style="{ backgroundColor: opt.color }" />
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

      <template #after>
        <q-btn
          v-if="!readonly && !disable"
          flat
          dense
          round
          icon="add"
          color="primary"
          size="sm"
          @click="showCreateDialog = true"
        >
          <q-tooltip>Create new tag</q-tooltip>
        </q-btn>
      </template>
    </q-select>

    <!-- Create Tag Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Create New Tag</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newTagName"
            label="Tag Name"
            outlined
            dense
            autofocus
            @keyup.enter="createTag"
          />

          <q-input
            v-model="newTagColor"
            label="Color"
            outlined
            dense
            class="q-mt-md"
          >
            <template #append>
              <q-icon name="colorize" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="newTagColor" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            v-model="newTagIcon"
            label="Icon (emoji)"
            outlined
            dense
            maxlength="2"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Create" color="primary" @click="createTag" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tagsStore'
import { useQuasar } from 'quasar'

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

const selectedTags = ref<any[]>([])
const showCreateDialog = ref(false)
const newTagName = ref('')
const newTagColor = ref('#6200EA')
const newTagIcon = ref('')

const tagOptions = computed(() => {
  return tagsStore.sortedTags.map(tag => ({
    label: tag.name,
    value: tag._id!,
    color: tag.color || '#6200EA',
    icon: tag.icon
  }))
})

onMounted(async () => {
  if (tagsStore.tags.length === 0) {
    await tagsStore.fetchTags()
  }
  updateSelectedTags()
})

function updateSelectedTags() {
  selectedTags.value = tagOptions.value.filter(opt =>
    props.modelValue.includes(opt.value)
  )
}

function emitUpdate(selected: any[]) {
  emit('update:modelValue', selected.map(s => s.value))
}

function removeTag(opt: any) {
  selectedTags.value = selectedTags.value.filter(t => t.value !== opt.value)
  emitUpdate(selectedTags.value)
}

async function createTag() {
  if (!newTagName.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Tag name is required'
    })
    return
  }

  try {
    const newTag = await tagsStore.createTag({
      name: newTagName.value.trim(),
      color: newTagColor.value,
      icon: newTagIcon.value.trim() || undefined
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

    // Reset form
    newTagName.value = ''
    newTagColor.value = '#6200EA'
    newTagIcon.value = ''
    showCreateDialog.value = false

    $q.notify({
      type: 'positive',
      message: 'Tag created successfully'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.body?.message || 'Failed to create tag'
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
