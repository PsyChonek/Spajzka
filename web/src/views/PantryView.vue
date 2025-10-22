<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { usePantryStore } from '@/stores/pantryStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useAuthStore } from '@/stores/authStore'
import type { PantryItem } from '@/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import SearchInput from '@/components/SearchInput.vue'

const $q = useQuasar()
const pantryStore = usePantryStore()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

// Note: No need to fetch items on mount - the router guard handles this

const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<PantryItem | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})

const allColumns = [
  {
    name: 'icon',
    label: '',
    align: 'center' as const,
    field: (row: PantryItem) => row.icon || '',
    sortable: false,
    classes: 'col-icon',
    headerClasses: 'col-icon'
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: PantryItem) => row.name || 'Unknown Item',
    sortable: true,
    classes: 'col-name',
    headerClasses: 'col-name'
  },
  {
    name: 'quantity',
    label: 'Quantity',
    align: 'left' as const,
    field: (row: PantryItem) => row.quantity || 0,
    sortable: true,
    classes: 'col-quantity',
    headerClasses: 'col-quantity'
  },
  {
    name: 'unit',
    label: 'Unit',
    align: 'left' as const,
    field: (row: PantryItem) => row.defaultUnit || 'pcs',
    sortable: true,
    classes: 'col-unit',
    headerClasses: 'col-unit'
  },
  {
    name: 'createdAt',
    label: 'Created',
    align: 'left' as const,
    field: (row: PantryItem) => row.createdAt,
    format: (val: string) => new Date(val).toLocaleDateString(),
    sortable: true,
    hideOnMobile: true,
    classes: 'col-created',
    headerClasses: 'col-created'
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false,
    hideOnMobile: true,
    classes: 'col-actions',
    headerClasses: 'col-actions'
  }
]

const columns = computed(() => {
  if ($q.screen.lt.md) {
    return allColumns.filter(col => !col.hideOnMobile)
  }
  return allColumns
})

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

const focusField = ref<'name' | 'quantity' | 'icon' | 'unit' | 'category'>('name')

// Check if user can edit item fields (not just quantity)
const canEditItemFields = computed(() => {
  if (!editingItem.value) return false

  // For global items, check if user has global_items:update permission
  if (editingItem.value.itemType === 'global') {
    return authStore.hasGlobalPermission('global_items:update')
  }

  // For group items, check if user has group_items:update permission
  // Note: This checks global permissions, but could be extended to check group-level permissions
  return authStore.hasGlobalPermission('group_items:update')
})

const openEditDialog = (item: PantryItem, field: 'name' | 'quantity' | 'icon' | 'unit' | 'category' = 'name') => {
  editingItem.value = item
  focusField.value = field
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
    // Update the pantry quantity
    await pantryStore.updateItem(editingItem.value._id, {
      quantity: data.quantity || 1
    })

    // If user has permission and item fields changed, update the underlying item
    if (canEditItemFields.value && editingItem.value.itemId) {
      const itemChanged =
        data.name !== editingItem.value.name ||
        data.defaultUnit !== editingItem.value.defaultUnit ||
        data.category !== editingItem.value.category ||
        data.icon !== editingItem.value.icon

      if (itemChanged) {
        const itemUpdates = {
          name: data.name,
          defaultUnit: data.defaultUnit,
          category: data.category,
          icon: data.icon
        }

        if (editingItem.value.itemType === 'global') {
          await itemsStore.updateGlobalItem(editingItem.value.itemId, itemUpdates)
        } else {
          await itemsStore.updateGroupItem(editingItem.value.itemId, itemUpdates)
        }

        // Refresh pantry to get updated item details
        await pantryStore.fetchItems()
      }
    }

    editingItem.value = null
  }
}

const deleteItem = (itemId: string) => {
  pantryStore.deleteItem(itemId)
}

const handleDeleteFromDialog = () => {
  if (!editingItem.value?._id) return
  deleteItem(editingItem.value._id)
}
</script>

<template>
  <PageWrapper>
    <div class="items-view">
    <div class="search-container">
      <SearchInput v-model="searchQuery" />

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
        dense
        flat
        bordered
      >
        <template v-slot:body-cell-icon="props">
          <q-td
            :props="props"
            class="cursor-pointer"
            @click="openEditDialog(props.row, 'icon')"
          >
            <div class="item-icon">{{ props.row.icon || '📦' }}</div>
          </q-td>
        </template>
        <template v-slot:body-cell-name="props">
          <q-td
            :props="props"
            class="cursor-pointer"
            @click="openEditDialog(props.row, 'name')"
          >
            {{ props.row.name || 'Unknown Item' }}
          </q-td>
        </template>
        <template v-slot:body-cell-quantity="props">
          <q-td
            :props="props"
            class="cursor-pointer"
            @click="openEditDialog(props.row, 'quantity')"
          >
            {{ props.row.quantity }}
          </q-td>
        </template>
        <template v-slot:body-cell-unit="props">
          <q-td
            :props="props"
            class="cursor-pointer"
            @click="openEditDialog(props.row, 'unit')"
          >
            {{ props.row.defaultUnit || 'pcs' }}
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
      :title="`Edit Item${editingItem ? ` (${editingItem.itemType === 'global' ? 'Global' : 'Group'})` : ''}`"
      :initial-data="initialFormData"
      :show-pantry-fields="true"
      :readonly-item-fields="!canEditItemFields"
      :focus-field="focusField"
      :show-delete-button="true"
      @save="saveEditedItem"
      @delete="handleDeleteFromDialog"
    />
    </div>
  </PageWrapper>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  gap: 2px;
  justify-content: center;
}

.item-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Table layout */
:deep(.q-table thead),
:deep(.q-table tbody),
:deep(.q-table tr) {
  width: 100%;
  display: table;
  table-layout: fixed;
}

:deep(.q-table th),
:deep(.q-table td) {
  padding: 8px;
  box-sizing: border-box;
}

/* Override Quasar's dense padding for first column */
:deep(.q-table--dense th:first-child),
:deep(.q-table--dense td:first-child) {
  padding-left: 8px;
}

/* Center icon column */
:deep(.q-table .col-icon) {
  width: 60px;
  text-align: center;
}

/* Desktop column widths */
:deep(.q-table .col-name) {
  width: auto;
}

:deep(.q-table .col-quantity) {
  width: 100px;
}

:deep(.q-table .col-unit) {
  width: 80px;
}

:deep(.q-table .col-created) {
  width: 120px;
}

:deep(.q-table .col-actions) {
  width: 100px;
}

/* Mobile styles */
@media (max-width: 1023px) {
  /* Column widths for mobile (4 columns) */
  :deep(.q-table .col-icon) {
    width: 15%;
  }

  :deep(.q-table .col-name) {
    width: 40%;
  }

  :deep(.q-table .col-quantity) {
    width: 25%;
  }

  :deep(.q-table .col-unit) {
    width: 20%;
  }

  /* Fill viewport height */
  .items-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .table-container :deep(.q-table) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .table-container :deep(.q-table__container) {
    flex: 1;
    min-height: 0;
  }

  .table-container :deep(.q-table__middle) {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
