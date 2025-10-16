<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePantryStore } from '@/stores/pantryStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useAuthStore } from '@/stores/authStore'
import type { PantryItem } from '@/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import SyncStatusBadge from '@/components/SyncStatusBadge.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'

const pantryStore = usePantryStore()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

// Fetch items from master list and pantry items on mount
onMounted(() => {
  itemsStore.fetchItems()
  pantryStore.fetchItems()
})

const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<PantryItem | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})

const columns = [
  {
    name: 'icon',
    label: '',
    align: 'center' as const,
    field: (row: PantryItem) => row.icon || '',
    sortable: false,
    style: 'width: 80px'
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: PantryItem) => row.name || 'Unknown Item',
    sortable: true,
    style: 'min-width: 200px'
  },
  {
    name: 'quantity',
    label: 'Quantity',
    align: 'center' as const,
    field: (row: PantryItem) => row.quantity || 0,
    sortable: true,
    style: 'width: 180px'
  },
  {
    name: 'createdAt',
    label: 'Created',
    align: 'left' as const,
    field: (row: PantryItem) => row.createdAt,
    format: (val: string) => new Date(val).toLocaleDateString(),
    sortable: true,
    style: 'width: 140px'
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false,
    style: 'width: 120px'
  }
]

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return pantryStore.sortedItems
  }

  const query = searchQuery.value.toLowerCase()
  return pantryStore.sortedItems.filter(item =>
    (item.name || '').toLowerCase().includes(query)
  )
})

const showAddButton = computed(() => {
  if (!searchQuery.value) return false

  // Show button if no items match, or if no exact match exists
  const query = searchQuery.value.toLowerCase().trim()
  const hasExactMatch = filteredItems.value.some(item =>
    (item.name || '').toLowerCase().trim() === query
  )

  return !hasExactMatch
})

// Suggest items from master Items list
const suggestedItems = computed(() => {
  if (!searchQuery.value) {
    return []
  }

  const query = searchQuery.value.toLowerCase().trim()

  // Get items from master list that aren't already in pantry (case-insensitive)
  const pantryItemNames = pantryStore.sortedItems.map(item => (item.name || '').toLowerCase().trim())

  return itemsStore.sortedItems
    .filter(item => {
      const itemNameLower = item.name.toLowerCase().trim()
      // Include if it matches the query and isn't already in pantry (exact match, case-insensitive)
      return (
        (itemNameLower.includes(query) ||
         (item.category && item.category.toLowerCase().trim().includes(query))) &&
        !pantryItemNames.includes(itemNameLower)
      )
    })
    .slice(0, 5) // Limit to 5 suggestions
})

const openAddDialog = () => {
  initialFormData.value = {
    name: searchQuery.value,
    defaultUnit: 'pcs',
    category: '',
    quantity: 1
  }
  showAddDialog.value = true
}

const openEditDialog = (item: PantryItem) => {
  editingItem.value = item
  initialFormData.value = {
    name: item.name || 'Unknown Item',
    defaultUnit: item.defaultUnit || 'pcs',
    category: item.category || '',
    icon: item.icon || '',
    quantity: item.quantity || 0
  }
  showEditDialog.value = true
}

const addFromSuggestion = async (item: any) => {
  // Add item directly without showing modal
  // Determine itemType based on the type property
  const itemType = item.type || 'global'

  await pantryStore.addItem({
    itemId: item._id,
    itemType: itemType as any,
    quantity: 1
  })
  searchQuery.value = ''
}

const saveNewItem = async (data: ItemFormData) => {
  // First, find if this item exists in the items store
  const existingItem = itemsStore.sortedItems.find(item =>
    item.name.toLowerCase().trim() === data.name.toLowerCase().trim()
  )

  if (existingItem && existingItem._id) {
    // Item exists, add reference to pantry
    const itemType = existingItem.type
    await pantryStore.addItem({
      itemId: existingItem._id,
      itemType: itemType as any,
      quantity: data.quantity || 1
    })
  } else {
    // Item doesn't exist, create it first as a group item
    await itemsStore.addGroupItem({
      name: data.name,
      category: data.category || 'Other',
      icon: data.icon || '📦',
      defaultUnit: data.defaultUnit || 'pcs'
    })

    // Find the newly created item (it will have a temp ID or real ID)
    const newItem = itemsStore.sortedItems.find(item =>
      item.name === data.name && item.type === 'group'
    )

    if (newItem) {
      // Add it to the pantry
      await pantryStore.addItem({
        itemId: newItem._id!,
        itemType: 'group' as any,
        quantity: data.quantity || 1
      })
    }
  }
  searchQuery.value = ''
}

const saveEditedItem = async (data: ItemFormData) => {
  if (editingItem.value && editingItem.value._id) {
    // For pantry items, we can only update the quantity, not the item reference
    await pantryStore.updateItem(editingItem.value._id, {
      quantity: data.quantity || 1
    })
    editingItem.value = null
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
  <PageWrapper>
    <div class="items-view">
      <!-- Sync Status Badge -->
      <SyncStatusBadge
        :last-synced="pantryStore.lastSynced"
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
      >
        <template v-slot:body-cell-icon="props">
          <q-td :props="props">
            <div class="item-icon">{{ props.row.icon || '📦' }}</div>
          </q-td>
        </template>
        <template v-slot:body-cell-quantity="props">
          <q-td :props="props">
            <div class="quantity-controls">
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
              <span class="quantity-value">{{ props.row.quantity }}</span>
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
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="action-buttons">
              <q-btn
                flat
                dense
                round
                color="primary"
                icon="edit"
                size="sm"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Edit item</q-tooltip>
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
    <AddItemDialog
      v-model="showAddDialog"
      title="Add New Item"
      :initial-data="initialFormData"
      :show-pantry-fields="true"
      @save="saveNewItem"
    />

    <!-- Edit Item Dialog -->
    <AddItemDialog
      v-model="showEditDialog"
      title="Edit Item"
      :initial-data="initialFormData"
      :show-pantry-fields="true"
      @save="saveEditedItem"
    />
    </div>
  </PageWrapper>
</template>

<style scoped>
.items-view {
  position: relative;
}

.sync-status {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

:deep(.sync-status) {
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

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.quantity-value {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
  font-size: 1.1rem;
}

.item-icon {
  font-size: 2rem;
  text-align: center;
}
</style>
