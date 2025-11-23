<template>
  <div class="tag-filter">
    <q-btn-dropdown
      flat
      dense
      :label="selectedLabel"
      :icon="selectedTags.length > 0 ? 'filter_alt' : 'filter_alt_off'"
      :color="selectedTags.length > 0 ? 'primary' : 'grey-7'"
    >
      <q-list>
        <q-item
          v-if="tagsStore.sortedTags.length === 0"
          dense
        >
          <q-item-section>
            <q-item-label caption>No tags available</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="tag in tagsStore.sortedTags"
          :key="tag._id"
          clickable
          dense
          @click="toggleTag(tag._id!)"
        >
          <q-item-section side>
            <q-checkbox
              :model-value="isSelected(tag._id!)"
              @update:model-value="toggleTag(tag._id!)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <span v-if="tag.icon">{{ tag.icon }} </span>
              {{ tag.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :style="{ backgroundColor: tag.color || '#6200EA' }" />
          </q-item-section>
        </q-item>

        <q-separator v-if="selectedTags.length > 0" class="q-my-xs" />

        <q-item
          v-if="selectedTags.length > 0"
          clickable
          dense
          @click="clearSelection"
        >
          <q-item-section>
            <q-item-label class="text-negative">Clear filters</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <!-- Selected tags chips -->
    <div v-if="selectedTags.length > 0" class="q-mt-sm row q-gutter-xs">
      <q-chip
        v-for="tagId in selectedTags"
        :key="tagId"
        removable
        dense
        :style="{
          backgroundColor: getTag(tagId)?.color || '#6200EA',
          color: getContrastColor(getTag(tagId)?.color || '#6200EA')
        }"
        @remove="toggleTag(tagId)"
      >
        <span v-if="getTag(tagId)?.icon">{{ getTag(tagId)?.icon }} </span>
        {{ getTag(tagId)?.name }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tagsStore'

interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const tagsStore = useTagsStore()
const selectedTags = ref<string[]>([...props.modelValue])

const selectedLabel = computed(() => {
  if (selectedTags.value.length === 0) {
    return 'Filter by tags'
  } else if (selectedTags.value.length === 1) {
    return '1 tag'
  } else {
    return `${selectedTags.value.length} tags`
  }
})

onMounted(async () => {
  if (tagsStore.tags.length === 0) {
    await tagsStore.fetchTags()
  }
})

function isSelected(tagId: string): boolean {
  return selectedTags.value.includes(tagId)
}

function toggleTag(tagId: string) {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  emit('update:modelValue', [...selectedTags.value])
}

function clearSelection() {
  selectedTags.value = []
  emit('update:modelValue', [])
}

function getTag(tagId: string) {
  return tagsStore.getTagById(tagId)
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
.tag-filter {
  display: inline-block;
}
</style>
