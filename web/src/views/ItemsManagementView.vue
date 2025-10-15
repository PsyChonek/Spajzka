<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/itemsStore'
import type { Item } from '@/services/api'
import PageWrapper from '@/components/PageWrapper.vue'
import { useAuthStore } from '@/stores/authStore'
import SyncStatusBadge from '@/components/SyncStatusBadge.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'

const itemsStore = useItemsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<Item | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: (row: Item) => row.name,
    sortable: true
  },
  {
    name: 'unit',
    label: 'Unit',
    align: 'center' as const,
    field: (row: Item) => row.unit,
    sortable: true
  },
  {
    name: 'category',
    label: 'Category',
    align: 'center' as const,
    field: (row: Item) => row.category || '-',
    sortable: true
  },
  {
    name: 'createdAt',
    label: 'Created',
    align: 'left' as const,
    field: (row: Item) => row.createdAt,
    format: (val: string | undefined) => val ? new Date(val).toLocaleDateString() : '-',
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
    return itemsStore.sortedItems
  }

  const query = searchQuery.value.toLowerCase()
  return itemsStore.sortedItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.unit.toLowerCase().includes(query) ||
    (item.category && item.category.toLowerCase().includes(query))
  )
})

const showAddButton = computed(() => {
  return searchQuery.value.length > 0 && filteredItems.value.length === 0
})

const openAddDialog = () => {
  initialFormData.value = {
    name: searchQuery.value,
    unit: 'pcs',
    category: ''
  }
  showAddDialog.value = true
}

const openEditDialog = (item: Item) => {
  editingItem.value = item
  initialFormData.value = {
    name: item.name,
    unit: item.unit,
    category: item.category || ''
  }
  showEditDialog.value = true
}

const saveNewItem = async (data: ItemFormData) => {
  await itemsStore.addItem({
    name: data.name,
    unit: data.unit!,
    category: data.category
  })
  searchQuery.value = ''
}

const saveEditedItem = async (data: ItemFormData) => {
  if (editingItem.value && editingItem.value._id) {
    await itemsStore.updateItem(editingItem.value._id, {
      name: data.name,
      unit: data.unit!,
      category: data.category
    })
    editingItem.value = null
  }
}

const deleteItem = (itemId: string) => {
  itemsStore.deleteItem(itemId)
}
</script>

<template>
  <PageWrapper>
    <div class="items-view">
      <!-- Sync Status Badge -->
      <SyncStatusBadge
        :last-synced="itemsStore.lastSynced"
        :is-authenticated="authStore.isAuthenticated"
      />

      <div class="search-container">
        <q-input
          v-model="searchQuery"
          outlined
          placeholder="Search items by name, unit, or category..."
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
        :fields="{
          name: true,
          unit: true,
          category: true
        }"
        @save="saveNewItem"
      />

      <!-- Edit Item Dialog -->
      <AddItemDialog
        v-model="showEditDialog"
        title="Edit Item"
        :initial-data="initialFormData"
        :fields="{
          name: true,
          unit: true,
          category: true
        }"
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
