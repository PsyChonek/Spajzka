<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { usePantryStore } from '@/stores/pantryStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useAuthStore } from '@/stores/authStore'
import type { PantryItem } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FabAdd from '@/components/common/FabAdd.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import SearchInput from '@/components/SearchInput.vue'
import TagFilter from '@/components/TagFilter.vue'
import { matchesQuery, normalizeForSearch } from '@/utils/search'
import { formatQuantity, type UnitType } from '@shared/units'

const $q = useQuasar()
const pantryStore = usePantryStore()
const itemsStore = useItemsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<PantryItem | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})
const focusField = ref<'name' | 'quantity' | 'icon' | 'unit' | 'category'>('name')

const allColumns = [
  { name: 'icon', label: '', align: 'center' as const, field: (r: PantryItem) => r.icon || '', sortable: false, classes: 'col-icon', headerClasses: 'col-icon' },
  { name: 'name', required: true, label: 'Name', align: 'left' as const, field: (r: PantryItem) => r.name || 'Unknown Item', sortable: true, classes: 'col-name', headerClasses: 'col-name' },
  { name: 'quantity', label: 'Quantity', align: 'left' as const, field: (r: PantryItem) => r.quantity || 0, sortable: true, classes: 'col-quantity', headerClasses: 'col-quantity' },
  { name: 'unit', label: 'Unit', align: 'left' as const, field: (r: PantryItem) => r.defaultUnit || 'pcs', sortable: true, classes: 'col-unit', headerClasses: 'col-unit' },
  { name: 'createdAt', label: 'Added', align: 'left' as const, field: (r: PantryItem) => r.createdAt, format: (v: string) => new Date(v).toLocaleDateString(), sortable: true, hideOnMobile: true, classes: 'col-created', headerClasses: 'col-created' },
  { name: 'actions', label: '', align: 'center' as const, field: '', sortable: false, hideOnMobile: true, classes: 'col-actions', headerClasses: 'col-actions' }
]

const columns = computed(() => $q.screen.lt.md ? allColumns.filter(c => !c.hideOnMobile) : allColumns)

const filteredItems = computed(() => {
  let filtered = pantryStore.sortedItems
  if (searchQuery.value) {
    filtered = filtered.filter(item => {
      const u = itemsStore.sortedItems.find((i: any) => i._id === item.itemId)
      return matchesQuery(searchQuery.value, item.name, ...((u?.searchNames as string[] | undefined) ?? []))
    })
  }
  if (selectedTagIds.value.length > 0) {
    filtered = filtered.filter(p => {
      const u = itemsStore.sortedItems.find((i: any) => i._id === p.itemId)
      if (!u || !u.tags || u.tags.length === 0) return false
      return u.tags.some((t: string) => selectedTagIds.value.includes(t))
    })
  }
  return filtered
})

const suggestedItems = computed(() => {
  if (!searchQuery.value) return []
  const keys = new Set(pantryStore.sortedItems.map(i => normalizeForSearch(i.name || '').trim()))
  return itemsStore.sortedItems
    .filter(i => {
      const k = normalizeForSearch(i.name).trim()
      return matchesQuery(searchQuery.value, i.name, i.category, ...((i.searchNames as string[] | undefined) ?? [])) && !keys.has(k)
    })
    .slice(0, 5)
})

const canEditItemFields = computed(() => {
  if (!editingItem.value) return false
  if (editingItem.value.itemType === 'global') return authStore.hasGlobalPermission('global_items:update')
  return authStore.hasGlobalPermission('group_items:update')
})

const openAddDialog = () => {
  initialFormData.value = { name: searchQuery.value, unitType: 'count', defaultUnit: 'pcs', category: '', quantity: 1 }
  showAddDialog.value = true
}

const openEditDialog = (item: PantryItem, field: 'name' | 'quantity' | 'icon' | 'unit' | 'category' = 'name') => {
  editingItem.value = item
  focusField.value = field
  initialFormData.value = {
    name: item.name || 'Unknown Item',
    unitType: item.unitType as UnitType | undefined,
    defaultUnit: item.defaultUnit || 'pcs',
    category: item.category || '',
    icon: item.icon || '',
    quantity: item.quantity || 0
  }
  showEditDialog.value = true
}

const addFromSuggestion = async (item: any) => {
  await pantryStore.addItem({
    itemId: item._id,
    itemType: (item.type || 'global') as any,
    quantity: 1
  })
  itemsStore.markItemsAsUsed([item._id])
  searchQuery.value = ''
}

const saveNewItem = async (data: ItemFormData) => {
  const existing = itemsStore.sortedItems.find(i => i.name.toLowerCase().trim() === data.name.toLowerCase().trim())
  if (existing && existing._id) {
    await pantryStore.addItem({ itemId: existing._id, itemType: existing.type as any, quantity: data.quantity || 1 })
    itemsStore.markItemsAsUsed([existing._id])
  } else {
    await itemsStore.addGroupItem({
      name: data.name,
      category: data.category || 'Other',
      icon: data.icon || '📦',
      unitType: (data.unitType || 'count') as any,
      defaultUnit: data.defaultUnit || 'pcs'
    })
    const created = itemsStore.sortedItems.find(i => i.name === data.name && i.type === 'group')
    if (created) {
      await pantryStore.addItem({ itemId: created._id!, itemType: 'group' as any, quantity: data.quantity || 1 })
      itemsStore.markItemsAsUsed([created._id!])
    }
  }
  searchQuery.value = ''
}

const saveEditedItem = async (data: ItemFormData) => {
  if (editingItem.value && editingItem.value._id) {
    await pantryStore.updateItem(editingItem.value._id, { quantity: data.quantity || 1 })
    if (canEditItemFields.value && editingItem.value.itemId) {
      const changed =
        data.name !== editingItem.value.name ||
        data.defaultUnit !== editingItem.value.defaultUnit ||
        data.category !== editingItem.value.category ||
        data.icon !== editingItem.value.icon
      if (changed) {
        const updates: any = { name: data.name, unitType: data.unitType, defaultUnit: data.defaultUnit, category: data.category, icon: data.icon }
        if (editingItem.value.itemType === 'global') {
          await itemsStore.updateGlobalItem(editingItem.value.itemId, updates)
        } else {
          await itemsStore.updateGroupItem(editingItem.value.itemId, updates)
        }
        await pantryStore.fetchItems()
      }
    }
    editingItem.value = null
  }
}

const deleteItem = (id: string) => pantryStore.deleteItem(id)
const handleDeleteFromDialog = () => editingItem.value?._id && deleteItem(editingItem.value._id)

const itemCount = computed(() => filteredItems.value.length)
const subtitle = computed(() => {
  const total = pantryStore.sortedItems.length
  if (searchQuery.value || selectedTagIds.value.length > 0) {
    return `${itemCount.value} of ${total} item${total !== 1 ? 's' : ''}`
  }
  return total === 0 ? 'Track what you have at home' : `${total} item${total !== 1 ? 's' : ''} in stock`
})
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader title="Pantry" :subtitle="subtitle" icon="kitchen">
        <template #actions>
          <q-btn
            color="secondary"
            unelevated
            no-caps
            icon="add"
            label="Add"
            class="gt-sm"
            @click="openAddDialog"
            aria-label="Add to pantry"
          />
        </template>
      </PageHeader>

      <!-- Search + filter -->
      <div class="sp-pantry__filters">
        <SearchInput v-model="searchQuery" @add="openAddDialog" />
        <ItemSuggestions
          v-if="suggestedItems.length > 0"
          :suggested-items="suggestedItems"
          class="q-mt-sm"
          @add-item="addFromSuggestion"
        />
        <div class="q-mt-sm">
          <TagFilter v-model="selectedTagIds" />
        </div>
      </div>

      <!-- Empty -->
      <EmptyState
        v-if="filteredItems.length === 0"
        :icon="searchQuery ? 'search_off' : 'kitchen'"
        :title="searchQuery ? 'No items found' : 'Your pantry is empty'"
        :hint="searchQuery ? 'Try a different search or tap Add to create a new item.' : 'Start tracking what you have. Tap the + button to add your first item.'"
      >
        <template #action>
          <q-btn color="secondary" unelevated no-caps icon="add" label="Add item" @click="openAddDialog" />
        </template>
      </EmptyState>

      <!-- Mobile: cards -->
      <div v-else class="sp-pantry__cards lt-md">
        <q-card
          v-for="row in filteredItems"
          :key="row._id"
          flat
          bordered
          class="sp-pantry-card"
          @click="openEditDialog(row, 'name')"
        >
          <q-card-section class="row items-center q-gutter-md no-wrap">
            <div class="sp-pantry-card__icon">{{ row.icon || '📦' }}</div>
            <div class="col">
              <div class="sp-pantry-card__name">{{ row.name || 'Unknown Item' }}</div>
              <div class="sp-pantry-card__meta">
                <span>{{ formatQuantity(row.quantity || 0, row.defaultUnit || 'pcs', { promote: true }) }}</span>
              </div>
            </div>
            <q-btn
              flat
              dense
              round
              icon="more_vert"
              aria-label="Item actions"
              @click.stop="openEditDialog(row, 'quantity')"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Desktop: table -->
      <div v-if="filteredItems.length > 0" class="sp-pantry__table sp-table gt-sm">
        <q-table
          :rows="filteredItems"
          :columns="columns"
          row-key="_id"
          :rows-per-page-options="[10, 25, 50]"
          flat
          bordered
        >
          <template v-slot:body-cell-icon="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'icon')">
              <div class="sp-pantry-card__icon">{{ props.row.icon || '📦' }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-name="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'name')">
              {{ props.row.name || 'Unknown Item' }}
            </q-td>
          </template>
          <template v-slot:body-cell-quantity="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'quantity')">
              <strong>{{ props.row.quantity }}</strong>
            </q-td>
          </template>
          <template v-slot:body-cell-unit="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'unit')">
              {{ props.row.defaultUnit || 'pcs' }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense round color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn flat dense round color="negative" icon="delete" size="sm" @click="deleteItem(props.row._id)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>

      <FabAdd class="lt-md" aria-label="Add to pantry" @click="openAddDialog" />

      <AddItemDialog
        v-model="showAddDialog"
        title="Add New Item"
        :initial-data="initialFormData"
        :show-pantry-fields="true"
        @save="saveNewItem"
      />

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
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-pantry__filters {
  margin-bottom: 16px;
}

.sp-pantry__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-pantry-card {
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}

.sp-pantry-card:hover {
  border-color: rgba(47, 125, 95, 0.35);
  box-shadow: var(--sp-shadow-2);
}

.sp-pantry-card__icon {
  font-size: 1.6rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sp-primary-soft);
  border-radius: 10px;
  flex-shrink: 0;
}

.sp-pantry-card__name {
  font-weight: 600;
  color: var(--sp-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-pantry-card__meta {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  margin-top: 2px;
}

.sp-pantry__table {
  background: var(--sp-surface);
  border-radius: var(--sp-r-md);
  overflow: hidden;
}

:deep(.sp-pantry__table .q-table thead) {
  background: var(--sp-surface-2);
}

:deep(.q-table .col-icon) { width: 64px; text-align: center; }
:deep(.q-table .col-quantity) { width: 100px; }
:deep(.q-table .col-unit) { width: 80px; }
:deep(.q-table .col-created) { width: 120px; }
:deep(.q-table .col-actions) { width: 100px; }
</style>
