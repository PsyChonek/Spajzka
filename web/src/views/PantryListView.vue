<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import type { PantryItem } from '@/services/api'

const pantryStore = usePantryStore()
const isOnline = () => navigator.onLine

const searchQuery = ref('')
const showAddDialog = ref(false)
const newItemName = ref('')
const newItemQuantity = ref(1)
const newItemPrice = ref(0)

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: PantryItem) => row.name,
    sortable: true
  },
  {
    name: 'quantity',
    label: 'Quantity',
    align: 'center' as const,
    field: (row: PantryItem) => row.quantity,
    sortable: true
  },
  {
    name: 'price',
    label: 'Price',
    align: 'right' as const,
    field: (row: PantryItem) => row.price,
    format: (val: number) => `$${val.toFixed(2)}`,
    sortable: true
  },
  {
    name: 'createdAt',
    label: 'Created',
    align: 'left' as const,
    field: (row: PantryItem) => row.createdAt,
    format: (val: string) => new Date(val).toLocaleDateString(),
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false
  }
]

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return pantryStore.sortedItems
  }
  
  const query = searchQuery.value.toLowerCase()
  return pantryStore.sortedItems.filter(item => 
    item.name.toLowerCase().includes(query)
  )
})

const showAddButton = computed(() => {
  return searchQuery.value.length > 0 && filteredItems.value.length === 0
})

const openAddDialog = () => {
  newItemName.value = searchQuery.value
  newItemQuantity.value = 1
  newItemPrice.value = 0
  showAddDialog.value = true
}

const closeAddDialog = () => {
  showAddDialog.value = false
  newItemName.value = ''
  newItemQuantity.value = 1
  newItemPrice.value = 0
}

const saveNewItem = async () => {
  if (newItemName.value.trim()) {
    await pantryStore.addItem({
      name: newItemName.value.trim(),
      quantity: newItemQuantity.value,
      price: newItemPrice.value
    })
    closeAddDialog()
    searchQuery.value = ''
  }
}

const incrementQuantity = (item: PantryItem) => {
  if (item._id) {
    pantryStore.incrementQuantity(item._id)
  }
}

const decrementQuantity = (item: PantryItem) => {
  if (item._id) {
    pantryStore.decrementQuantity(item._id)
  }
}

const deleteItem = (itemId: string) => {
  pantryStore.deleteItem(itemId)
}
</script>

<template>
  <div class="items-view q-pa-md">
    <!-- Sync Status Badge -->
    <div class="sync-status">
      <q-badge v-if="!isOnline()" color="orange" class="q-pa-sm">
        <q-icon name="cloud_off" size="xs" class="q-mr-xs" />
        Offline Mode
      </q-badge>
      <q-badge v-else-if="pantryStore.lastSynced" color="positive" class="q-pa-sm">
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
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="action-buttons">
              <q-btn
                flat
                dense
                round
                color="positive"
                icon="add"
                size="sm"
                @click="incrementQuantity(props.row)"
              >
                <q-tooltip>Increase quantity</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="warning"
                icon="remove"
                size="sm"
                @click="decrementQuantity(props.row)"
              >
                <q-tooltip>Decrease quantity</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="deleteItem(props.row._id)"
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
            class="q-mb-md"
            @keyup.enter="saveNewItem"
          />
          <q-input
            v-model.number="newItemQuantity"
            outlined
            label="Quantity"
            type="number"
            min="1"
            class="q-mb-md"
          />
          <q-input
            v-model.number="newItemPrice"
            outlined
            label="Price"
            type="number"
            min="0"
            step="0.01"
            prefix="$"
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
.items-view {
  max-width: 1400px;
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

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}
</style>
