<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/itemsStore'
import type { Item } from '@/services/api'
import PageWrapper from '@/components/PageWrapper.vue'
import { useAuthStore } from '@/stores/authStore'
import SyncStatusBadge from '@/components/SyncStatusBadge.vue'

const itemsStore = useItemsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<Item | null>(null)

// Form fields
const formName = ref('')
const formUnit = ref('')
const formCategory = ref('')
const formPrice = ref<number | undefined>(undefined)
const formExpiryDate = ref('')

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
    name: 'price',
    label: 'Price',
    align: 'right' as const,
    field: (row: Item) => row.price,
    format: (val: number | undefined) => val ? `$${val.toFixed(2)}` : '-',
    sortable: true
  },
  {
    name: 'expiryDate',
    label: 'Expiry Date',
    align: 'center' as const,
    field: (row: Item) => row.expiryDate,
    format: (val: string | undefined) => val ? new Date(val).toLocaleDateString() : '-',
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
  formName.value = searchQuery.value
  formUnit.value = 'pcs'
  formCategory.value = ''
  formPrice.value = undefined
  formExpiryDate.value = ''
  showAddDialog.value = true
}

const closeAddDialog = () => {
  showAddDialog.value = false
  formName.value = ''
  formUnit.value = ''
  formCategory.value = ''
  formPrice.value = undefined
  formExpiryDate.value = ''
}

const openEditDialog = (item: Item) => {
  editingItem.value = item
  formName.value = item.name
  formUnit.value = item.unit
  formCategory.value = item.category || ''
  formPrice.value = item.price
  formExpiryDate.value = item.expiryDate || ''
  showEditDialog.value = true
}

const closeEditDialog = () => {
  showEditDialog.value = false
  editingItem.value = null
  formName.value = ''
  formUnit.value = ''
  formCategory.value = ''
  formPrice.value = undefined
  formExpiryDate.value = ''
}

const saveNewItem = async () => {
  if (formName.value.trim() && formUnit.value.trim()) {
    await itemsStore.addItem({
      name: formName.value.trim(),
      unit: formUnit.value.trim(),
      category: formCategory.value.trim() || undefined,
      price: formPrice.value,
      expiryDate: formExpiryDate.value || undefined
    })
    closeAddDialog()
    searchQuery.value = ''
  }
}

const saveEditedItem = async () => {
  if (editingItem.value && editingItem.value._id && formName.value.trim() && formUnit.value.trim()) {
    await itemsStore.updateItem(editingItem.value._id, {
      name: formName.value.trim(),
      unit: formUnit.value.trim(),
      category: formCategory.value.trim() || undefined,
      price: formPrice.value,
      expiryDate: formExpiryDate.value || undefined
    })
    closeEditDialog()
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
      <q-dialog v-model="showAddDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Add New Item</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="formName"
              outlined
              label="Item Name *"
              autofocus
              class="q-mb-md"
              @keyup.enter="saveNewItem"
            />
            <q-input
              v-model="formUnit"
              outlined
              label="Unit *"
              placeholder="e.g., kg, pcs, liter"
              class="q-mb-md"
            />
            <q-input
              v-model="formCategory"
              outlined
              label="Category"
              placeholder="e.g., Dairy, Vegetables"
              class="q-mb-md"
            />
            <q-input
              v-model.number="formPrice"
              outlined
              label="Price per Unit"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              class="q-mb-md"
            />
            <q-input
              v-model="formExpiryDate"
              outlined
              label="Expiry Date"
              type="date"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" @click="closeAddDialog" />
            <q-btn
              label="Save"
              color="primary"
              @click="saveNewItem"
              :disable="!formName.trim() || !formUnit.trim()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Edit Item Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Edit Item</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="formName"
              outlined
              label="Item Name *"
              autofocus
              class="q-mb-md"
              @keyup.enter="saveEditedItem"
            />
            <q-input
              v-model="formUnit"
              outlined
              label="Unit *"
              placeholder="e.g., kg, pcs, liter"
              class="q-mb-md"
            />
            <q-input
              v-model="formCategory"
              outlined
              label="Category"
              placeholder="e.g., Dairy, Vegetables"
              class="q-mb-md"
            />
            <q-input
              v-model.number="formPrice"
              outlined
              label="Price per Unit"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              class="q-mb-md"
            />
            <q-input
              v-model="formExpiryDate"
              outlined
              label="Expiry Date"
              type="date"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" @click="closeEditDialog" />
            <q-btn
              label="Save"
              color="primary"
              @click="saveEditedItem"
              :disable="!formName.trim() || !formUnit.trim()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
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
