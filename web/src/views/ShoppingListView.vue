<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import type { ShoppingItem } from '@/services/api'
import PageWrapper from '@/components/PageWrapper.vue'
import SyncStatusBadge from '@/components/SyncStatusBadge.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import { useAuthStore } from '@/stores/authStore'

const shoppingStore = useShoppingStore()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

// Fetch items from master list on mount
onMounted(() => {
  itemsStore.fetchItems()
})

const searchQuery = ref('')
const showAddDialog = ref(false)
const initialFormData = ref<Partial<ItemFormData>>({})

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Item',
    align: 'left' as const,
    field: (row: ShoppingItem) => row.name,
    sortable: false
  }
]

const filteredItems = computed(() => {
  let filtered = shoppingStore.sortedItems
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const showAddButton = computed(() => {
  if (!searchQuery.value) return false

  // Show button if no items match, or if no exact match exists
  const query = searchQuery.value.toLowerCase().trim()
  const hasExactMatch = filteredItems.value.some(item =>
    item.name.toLowerCase().trim() === query
  )

  return !hasExactMatch
})

// Suggest items from master Items list
const suggestedItems = computed(() => {
  if (!searchQuery.value) {
    return []
  }

  const query = searchQuery.value.toLowerCase().trim()

  // Get items from master list that aren't already in shopping list (case-insensitive)
  const shoppingItemNames = shoppingStore.sortedItems.map(item => item.name.toLowerCase().trim())

  return itemsStore.sortedItems
    .filter(item => {
      const itemNameLower = item.name.toLowerCase().trim()
      // Include if it matches the query and isn't already in shopping list (exact match, case-insensitive)
      return (
        (itemNameLower.includes(query) ||
         (item.category && item.category.toLowerCase().trim().includes(query))) &&
        !shoppingItemNames.includes(itemNameLower)
      )
    })
    .slice(0, 5) // Limit to 5 suggestions
})

const openAddDialog = () => {
  initialFormData.value = {
    name: searchQuery.value
  }
  showAddDialog.value = true
}

const addFromSuggestion = async (item: any) => {
  // Add item directly without showing modal
  await shoppingStore.addItem({
    name: item.name,
    completed: false
  })
  searchQuery.value = ''
}

const saveNewItem = async (data: ItemFormData) => {
  await shoppingStore.addItem({
    name: data.name,
    completed: false
  })
  searchQuery.value = ''
}

const toggleItem = (item: ShoppingItem) => {
  if (item._id) {
    shoppingStore.toggleItem(item._id)
  }
}

const deleteItem = (item: ShoppingItem, event: Event) => {
  event.stopPropagation() // Prevent toggling the item when clicking delete
  if (item._id) {
    shoppingStore.deleteItem(item._id)
  }
}
</script>

<template>
  <PageWrapper>
    <div class="shopping-list-view">
      <!-- Sync Status Badge -->
      <SyncStatusBadge
        :last-synced="shoppingStore.lastSynced"
        :is-authenticated="authStore.isAuthenticated"
      />

    <div class="search-container">
      <q-input
        v-model="searchQuery"
        outlined
        placeholder="Search items..."
        class="search-input"
        clearable
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- Suggestions from Items list -->
      <ItemSuggestions
        :suggested-items="suggestedItems"
        class="q-mt-md"
        @add-item="addFromSuggestion"
      />

      <div v-if="showAddButton" class="add-button-container q-mt-md">
        <q-btn
          color="primary"
          icon="add"
          label="Add Item"
          @click="openAddDialog"
        />
      </div>
    </div>

    <div class="table-container q-mt-lg">
      <q-table
        :rows="filteredItems"
        :columns="columns"
        row-key="_id"
        :rows-per-page-options="[10, 25, 50]"
        flat
        bordered
        hide-header
      >
        <template v-slot:body-cell-name="props">
          <q-td
            :props="props"
            class="item-name-cell clickable"
            @click="toggleItem(props.row)"
          >
            <div class="item-row">
              <span
                class="item-name"
                :class="{ 'completed': props.row.completed }"
              >
                {{ props.value }}
              </span>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                class="delete-btn"
                @click="deleteItem(props.row, $event)"
              >
                <q-tooltip>Delete item</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
        <template v-slot:no-data>
          <div class="full-width row flex-center q-gutter-sm q-py-lg">
            <q-icon size="2em" name="inbox" />
            <span class="text-h6">
              {{ searchQuery ? 'No items found' : 'No items yet' }}
            </span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- Add Item Dialog -->
    <AddItemDialog
      v-model="showAddDialog"
      title="Add New Item"
      :initial-data="initialFormData"
      :fields="{
        name: true
      }"
      @save="saveNewItem"
    />
    </div>
  </PageWrapper>
</template>

<style scoped>
.shopping-list-view {
  position: relative;
}

.sync-status {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10vh;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  max-width: 800px;
  font-size: 1.2rem;
}

.search-input :deep(.q-field__control) {
  height: 60px;
}

.add-button-container {
  display: flex;
  justify-content: center;
}

.table-container {
  width: 100%;
}

.item-name-cell {
  font-size: 1.1rem;
  padding: 16px 24px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.item-name-cell:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.item-name {
  font-weight: 500;
  transition: all 0.3s;
  flex: 1;
}

.item-name.completed {
  text-decoration: line-through;
  opacity: 0.5;
  color: #666;
}

.delete-btn {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
}

</style>
