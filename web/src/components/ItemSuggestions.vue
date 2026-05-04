<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Item } from '@/stores/itemsStore'
import { useContentLocale, tName } from '@/services/i18n/translateContent'

const { t } = useI18n({ useScope: 'global' })
const itemsLocale = useContentLocale()
const itemDisplayName = (item: Item) => tName(item, itemsLocale.value) || item.name

interface Props {
  suggestedItems: Item[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'addItem', item: Item): void
}>()

const handleAddItem = (item: Item) => {
  emit('addItem', item)
}
</script>

<template>
  <div v-if="suggestedItems.length > 0" class="suggestions-container">
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ t('items.title') }}:</div>
    <div class="suggestions-list">
      <q-card
        v-for="item in suggestedItems"
        :key="item._id"
        class="suggestion-card cursor-pointer"
        @click="handleAddItem(item)"
      >
        <q-card-section class="q-pa-md">
          <div class="suggestion-content">
            <div class="suggestion-text">
              <div class="suggestion-icon">{{ item.icon || '📦' }}</div>
              <div>
                <div class="text-weight-medium">{{ itemDisplayName(item) }}</div>
                <div class="text-caption text-grey-7">
                  {{ item.defaultUnit || '-' }}
                  <span v-if="item.category"> • {{ item.category }}</span>
                </div>
              </div>
            </div>
            <q-icon name="add_circle" color="primary" size="sm" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.suggestions-container {
  width: 100%;
  max-width: 800px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.suggestion-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.suggestion-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.suggestion-text {
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestion-icon {
  font-size: 2rem;
}
</style>
