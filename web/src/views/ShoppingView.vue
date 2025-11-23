<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import { CreateShoppingItemRequest, type ShoppingItem } from '@/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import SearchInput from '@/components/SearchInput.vue'

const shoppingStore = useShoppingStore()
const itemsStore = useItemsStore()

// Note: No need to fetch items on mount - the router guard handles this

const searchQuery = ref('')
const showAddDialog = ref(false)
const initialFormData = ref<Partial<ItemFormData>>({})

const columns = computed(() => [
  {
    name: 'icon',
    label: '',
    align: 'center' as const,
    field: (row: ShoppingItem) => row.icon || '',
    sortable: false,
    classes: 'col-icon',
    headerClasses: 'col-icon'
  },
  {
    name: 'name',
    required: true,
    label: 'Item',
    align: 'left' as const,
    field: (row: ShoppingItem) => row.name || 'Loading...',
    sortable: false,
    classes: 'col-name',
    headerClasses: 'col-name'
  }
])

const filteredItems = computed(() => {
  let filtered = shoppingStore.sortedItems

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name?.toLowerCase().includes(query) ?? false
    )
  }

  return filtered
})

// Suggest items from master Items list
const suggestedItems = computed(() => {
  if (!searchQuery.value) {
    return []
  }

  const query = searchQuery.value.toLowerCase().trim()

  // Get items from master list that aren't already in shopping list (case-insensitive)
  const shoppingItemNames = shoppingStore.sortedItems
    .map(item => item.name?.toLowerCase().trim())
    .filter(name => name !== undefined) as string[]

  return itemsStore.sortedItems
    .filter(item => {
      const itemNameLower = item.name.toLowerCase().trim()
      // Include if it matches the query and isn't already in shopping list (exact match, case-insensitive)
      return (
        (itemNameLower.includes(query) ||
         (item.category && item.category.toLowerCase().trim().includes(query)) ||
         (item.searchNames && item.searchNames.some(name => name.toLowerCase().includes(query)))) &&
        !shoppingItemNames.includes(itemNameLower)
      )
    })
    .slice(0, 5) // Limit to 5 suggestions
})

const openAddDialog = () => {
  initialFormData.value = {
    name: searchQuery.value,
    defaultUnit: 'pcs',
    category: ''
  }
  showAddDialog.value = true
}

const addFromSuggestion = async (item: any) => {
  // Add item directly without showing modal
  // item has _id and type from itemsStore
  await shoppingStore.addItem({
    itemId: item._id,
    itemType: item.type as CreateShoppingItemRequest.itemType,
    quantity: 1
  })
  searchQuery.value = ''
}

const saveNewItem = async (data: ItemFormData) => {
  // First, create the item in the items store (as a group item)
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
    // Add it to the shopping list
    await shoppingStore.addItem({
      itemId: newItem._id!,
      itemType: CreateShoppingItemRequest.itemType.GROUP,
      quantity: 1
    })
  }

  searchQuery.value = ''
}

const toggleItem = (item: ShoppingItem) => {
  if (item._id) {
    shoppingStore.toggleItem(item._id)
  }
}
</script>

<template>
  <PageWrapper>
    <div class="shopping-list-view">
    <div class="search-container">
      <SearchInput v-model="searchQuery" @add="openAddDialog" />

      <!-- Suggestions from Items list -->
      <ItemSuggestions
        :suggested-items="suggestedItems"
        class="q-mt-md"
        @add-item="addFromSuggestion"
      />
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
        hide-header
      >
        <template v-slot:body-cell-icon="props">
          <q-td
            :props="props"
            class="icon-cell"
            @click="toggleItem(props.row)"
          >
            <div class="item-icon">{{ props.row.icon || '📦' }}</div>
          </q-td>
        </template>
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
    <AddItemDialog
      v-model="showAddDialog"
      title="Add New Item"
      :initial-data="initialFormData"
      :show-pantry-fields="false"
      @save="saveNewItem"
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

.table-container {
  width: 100%;
}

.item-name-cell {
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

.item-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-cell {
  cursor: pointer;
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

/* Name column takes remaining space */
:deep(.q-table .col-name) {
  width: auto;
}

/* Mobile: Expand table to fill viewport height */
@media (max-width: 1023px) {
  .shopping-list-view {
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

  /* Mobile column widths */
  :deep(.q-table .col-icon) {
    width: 60px;
  }
}
</style>
