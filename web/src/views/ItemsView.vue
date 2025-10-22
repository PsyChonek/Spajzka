<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useItemsStore, type Item } from '@/stores/itemsStore'
import PageWrapper from '@/components/PageWrapper.vue'
import { useAuthStore } from '@/stores/authStore'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SearchInput from '@/components/SearchInput.vue'

const $q = useQuasar()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingItem = ref<Item | null>(null)
const deletingItem = ref<Item | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})

const allColumns = [
  {
    name: 'icon',
    label: '',
    align: 'center' as const,
    field: (row: Item) => row.icon || '',
    sortable: false,
    style: 'width: 50px',
    headerStyle: 'width: 50px'
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: Item) => row.name,
    sortable: true
  },
  {
    name: 'type',
    label: 'Type',
    align: 'center' as const,
    field: (row: Item) => row.type,
    sortable: true,
    style: 'width: 100px',
    headerStyle: 'width: 100px',
    hideOnMobile: true
  },
  {
    name: 'defaultUnit',
    label: 'Unit',
    align: 'center' as const,
    field: (row: Item) => row.defaultUnit || '-',
    sortable: true,
    style: 'width: 80px',
    headerStyle: 'width: 80px'
  },
  {
    name: 'category',
    label: 'Category',
    align: 'center' as const,
    field: (row: Item) => row.category || '-',
    sortable: true,
    style: 'width: 120px',
    headerStyle: 'width: 120px',
    hideOnMobile: true
  },
  {
    name: 'createdAt',
    label: 'Created',
    align: 'left' as const,
    field: (row: Item) => row.createdAt,
    format: (val: string | undefined) => val ? new Date(val).toLocaleDateString() : '-',
    sortable: true,
    style: 'width: 110px',
    headerStyle: 'width: 110px',
    hideOnMobile: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: '',
    sortable: false,
    style: 'width: 100px',
    headerStyle: 'width: 100px'
  }
]

const columns = computed(() => {
  if ($q.screen.lt.md) {
    return allColumns.filter((col: any) => !col.hideOnMobile)
  }
  return allColumns
})

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return itemsStore.sortedItems
  }

  const query = searchQuery.value.toLowerCase()
  return itemsStore.sortedItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    (item.defaultUnit && item.defaultUnit.toLowerCase().includes(query)) ||
    (item.category && item.category.toLowerCase().includes(query))
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

const canCreateGlobalItems = computed(() => {
  return authStore.hasGlobalPermission('global_items:create')
})

const canUpdateGlobalItems = computed(() => {
  return authStore.hasGlobalPermission('global_items:update')
})

const canDeleteGlobalItems = computed(() => {
  return authStore.hasGlobalPermission('global_items:delete')
})

const openAddDialog = () => {
  initialFormData.value = {
    name: searchQuery.value,
    defaultUnit: 'pcs',
    category: ''
  }
  showAddDialog.value = true
}

const openEditDialog = (item: Item) => {
  editingItem.value = item
  initialFormData.value = {
    name: item.name,
    defaultUnit: item.defaultUnit,
    category: item.category || '',
    icon: item.icon || ''
  }
  showEditDialog.value = true
}

const saveNewItem = async (data: ItemFormData) => {
  // Check if user wants to create as global item
  if (data.isGlobal) {
    await itemsStore.addGlobalItem({
      name: data.name,
      category: data.category || 'Other',
      defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon
    })
  } else {
    await itemsStore.addGroupItem({
      name: data.name,
      category: data.category || 'Other',
      defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon
    })
  }
  searchQuery.value = ''
}

const saveEditedItem = async (data: ItemFormData) => {
  if (editingItem.value && editingItem.value._id) {
    const updates = {
      name: data.name,
      category: data.category || 'Other',
      defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon
    }

    // Update based on item type
    if (editingItem.value.type === 'global') {
      await itemsStore.updateGlobalItem(editingItem.value._id, updates)
    } else {
      await itemsStore.updateGroupItem(editingItem.value._id, updates)
    }
    editingItem.value = null
  }
}

const deleteItem = (item: Item) => {
  deletingItem.value = item
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (!deletingItem.value) return

  if (deletingItem.value.type === 'global') {
    itemsStore.deleteGlobalItem(deletingItem.value._id!)
  } else {
    itemsStore.deleteGroupItem(deletingItem.value._id!)
  }
  deletingItem.value = null
}

const cancelDelete = () => {
  deletingItem.value = null
}

const deleteDialogMessage = computed(() => {
  if (!deletingItem.value) return ''
  const itemTypeLabel = deletingItem.value.type === 'global' ? 'global item' : 'group item'
  return `Are you sure you want to delete "<strong>${deletingItem.value.name}</strong>"?<br><br>This ${itemTypeLabel} will be removed from all pantry and shopping lists.`
})

const canEditItem = (item: Item) => {
  if (item.type === 'global') {
    return canUpdateGlobalItems.value
  }
  return true // Group items can always be edited by group members
}

const canDeleteItem = (item: Item) => {
  if (item.type === 'global') {
    return canDeleteGlobalItems.value
  }
  return true // Group items can always be deleted by group members
}
</script>

<template>
  <PageWrapper>
    <div class="items-view">
      <div class="search-container">
        <SearchInput v-model="searchQuery" />

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
            <q-td :props="props">
              <div class="item-icon">{{ props.row.icon || '📋' }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-badge
                v-if="props.row.type === 'global'"
                color="primary"
                label="Global"
              >
                <q-tooltip>
                  This item is shared across all users
                </q-tooltip>
              </q-badge>
              <q-badge
                v-else
                color="secondary"
                outline
                label="Group"
              >
                <q-tooltip>
                  This item is only visible to your group
                </q-tooltip>
              </q-badge>
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
                  :disable="!canEditItem(props.row)"
                  @click="openEditDialog(props.row)"
                >
                  <q-tooltip>{{ canEditItem(props.row) ? 'Edit item' : 'No permission to edit' }}</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  :disable="!canDeleteItem(props.row)"
                  @click="deleteItem(props.row)"
                >
                  <q-tooltip>{{ canDeleteItem(props.row) ? 'Delete item' : 'No permission to delete' }}</q-tooltip>
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
        :show-global-toggle="canCreateGlobalItems"
        @save="saveNewItem"
      />

      <!-- Edit Item Dialog -->
      <AddItemDialog
        v-model="showEditDialog"
        title="Edit Item"
        :initial-data="initialFormData"
        @save="saveEditedItem"
      />

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        v-model="showDeleteDialog"
        title="Delete Item"
        :message="deleteDialogMessage"
        type="danger"
        confirm-label="Delete"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </div>
  </PageWrapper>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4vh;
  margin-bottom: 2rem;
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
  text-align: center;
}

/* Compact table cells */
:deep(.q-table tbody td) {
  padding: 4px 8px;
}

:deep(.q-table thead th) {
  padding: 8px 8px;
}
</style>
