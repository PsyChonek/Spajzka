<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShoppingStore } from '@/stores/shoppingStore'
import type { ShoppingItem } from '@/services/api'

const shoppingStore = useShoppingStore()
const isOnline = () => navigator.onLine

const searchQuery = ref('')
const showAddDialog = ref(false)
const newItemName = ref('')

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
  return searchQuery.value.length > 0 && filteredItems.value.length === 0
})

const openAddDialog = () => {
  newItemName.value = searchQuery.value
  showAddDialog.value = true
}

const closeAddDialog = () => {
  showAddDialog.value = false
  newItemName.value = ''
}

const saveNewItem = async () => {
  if (newItemName.value.trim()) {
    await shoppingStore.addItem({
      name: newItemName.value.trim(),
      completed: false
    })
    closeAddDialog()
    searchQuery.value = ''
  }
}

const toggleItem = (item: ShoppingItem) => {
  if (item._id) {
    shoppingStore.toggleItem(item._id)
  }
}
</script>

<template>
  <div class="shopping-list-view q-pa-md">
    <!-- Sync Status Badge -->
    <div class="sync-status">
      <q-badge v-if="!isOnline()" color="orange" class="q-pa-sm">
        <q-icon name="cloud_off" size="xs" class="q-mr-xs" />
        Offline Mode
      </q-badge>
      <q-badge v-else-if="shoppingStore.lastSynced" color="positive" class="q-pa-sm">
        <q-icon name="cloud_done" size="xs" class="q-mr-xs" />
        Synced
      </q-badge>
      <q-badge v-else color="grey-7" class="q-pa-sm">
        <q-icon name="storage" size="xs" class="q-mr-xs" />
        Local Storage
      </q-badge>
    </div>

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

      <div v-if="showAddButton" class="add-button-container q-mt-md">
        <q-btn
          color="primary"
          icon="add"
          label="Add Item"
          @click="openAddDialog"
          size="lg"
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
            <span 
              class="item-name"
              :class="{ 'completed': props.row.completed }"
            >
              {{ props.value }}
            </span>
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
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Item</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newItemName"
            outlined
            label="Item Name"
            autofocus
            @keyup.enter="saveNewItem"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeAddDialog" />
          <q-btn 
            label="Save" 
            color="primary" 
            @click="saveNewItem"
            :disable="!newItemName.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.shopping-list-view {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
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

.item-name {
  font-weight: 500;
  transition: all 0.3s;
}

.item-name.completed {
  text-decoration: line-through;
  opacity: 0.5;
  color: #666;
}
</style>
