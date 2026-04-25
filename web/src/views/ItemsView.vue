<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useItemsStore, type Item } from '@/stores/itemsStore'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FabAdd from '@/components/common/FabAdd.vue'
import { useAuthStore } from '@/stores/authStore'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SearchInput from '@/components/SearchInput.vue'
import TagFilter from '@/components/TagFilter.vue'
import { useTagsStore } from '@/stores/tagsStore'
import { matchesQuery } from '@/utils/search'

const $q = useQuasar()
const itemsStore = useItemsStore()
const authStore = useAuthStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingItem = ref<Item | null>(null)
const deletingItem = ref<Item | null>(null)
const initialFormData = ref<Partial<ItemFormData>>({})
const focusField = ref<'name' | 'icon' | 'unit' | 'category'>('name')

const allColumns = [
  { name: 'icon', label: '', align: 'center' as const, field: (r: Item) => r.icon || '', sortable: false, classes: 'col-icon', headerClasses: 'col-icon' },
  { name: 'name', required: true, label: 'Name', align: 'left' as const, field: (r: Item) => r.name, sortable: true, classes: 'col-name', headerClasses: 'col-name' },
  { name: 'defaultUnit', label: 'Unit', align: 'left' as const, field: (r: Item) => r.defaultUnit || '-', sortable: true, classes: 'col-unit', headerClasses: 'col-unit' },
  { name: 'category', label: 'Category', align: 'left' as const, field: (r: Item) => r.category || '-', sortable: true, hideOnMobile: true, classes: 'col-category', headerClasses: 'col-category' },
  { name: 'tags', label: 'Tags', align: 'left' as const, field: (r: Item) => r.tags || [], sortable: false, hideOnMobile: true, classes: 'col-tags', headerClasses: 'col-tags' },
  { name: 'actions', label: '', align: 'center' as const, field: '', sortable: false, hideOnMobile: true, classes: 'col-actions', headerClasses: 'col-actions' }
]

const columns = computed(() => $q.screen.lt.md ? allColumns.filter((c: any) => !c.hideOnMobile) : allColumns)

const filteredItems = computed(() => {
  let items = itemsStore.sortedItems
  if (searchQuery.value) {
    items = items.filter(item =>
      matchesQuery(searchQuery.value, item.name, item.defaultUnit, item.category, ...(item.searchNames ?? []))
    )
  }
  if (selectedTagIds.value.length > 0) {
    items = items.filter(item => {
      if (!item.tags || item.tags.length === 0) return false
      return item.tags.some(t => selectedTagIds.value.includes(t))
    })
  }
  return items
})

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#FFF'
}

const canCreateGlobalItems = computed(() => authStore.hasGlobalPermission('global_items:create'))
const canUpdateGlobalItems = computed(() => authStore.hasGlobalPermission('global_items:update'))
const canDeleteGlobalItems = computed(() => authStore.hasGlobalPermission('global_items:delete'))

const openAddDialog = () => {
  initialFormData.value = { name: searchQuery.value, defaultUnit: 'pcs', category: '' }
  showAddDialog.value = true
}

const openEditDialog = (item: Item, field: 'name' | 'icon' | 'unit' | 'category' = 'name') => {
  editingItem.value = item
  focusField.value = field
  initialFormData.value = {
    name: item.name,
    defaultUnit: item.defaultUnit,
    category: item.category || '',
    icon: item.icon || '',
    searchNames: item.searchNames || [],
    tags: item.tags || []
  }
  showEditDialog.value = true
}

const saveNewItem = async (data: ItemFormData) => {
  if (data.isGlobal) {
    await itemsStore.addGlobalItem({
      name: data.name, category: data.category || 'Other', defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon, searchNames: data.searchNames, tags: data.tags
    })
  } else {
    await itemsStore.addGroupItem({
      name: data.name, category: data.category || 'Other', defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon, searchNames: data.searchNames, tags: data.tags
    })
  }
  searchQuery.value = ''
}

const saveEditedItem = async (data: ItemFormData) => {
  if (editingItem.value && editingItem.value._id) {
    const updates = {
      name: data.name, category: data.category || 'Other', defaultUnit: data.defaultUnit || 'pcs',
      icon: data.icon, searchNames: data.searchNames, tags: data.tags
    }
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

const handleDeleteFromDialog = () => editingItem.value && deleteItem(editingItem.value)

const confirmDelete = () => {
  if (!deletingItem.value) return
  if (deletingItem.value.type === 'global') itemsStore.deleteGlobalItem(deletingItem.value._id!)
  else itemsStore.deleteGroupItem(deletingItem.value._id!)
  deletingItem.value = null
}

const cancelDelete = () => { deletingItem.value = null }

const deleteDialogMessage = computed(() => {
  if (!deletingItem.value) return ''
  return `Are you sure you want to delete "<strong>${deletingItem.value.name}</strong>"?<br><br>This item will be removed from all pantry and shopping lists.`
})

const canEditItem = (item: Item) => item.type === 'global' ? canUpdateGlobalItems.value : true
const canDeleteItem = (item: Item) => item.type === 'global' ? canDeleteGlobalItems.value : true

const canDeleteCurrentItem = computed(() => editingItem.value ? canDeleteItem(editingItem.value) : false)
const canEditItemFields = computed(() => {
  if (!editingItem.value) return false
  return editingItem.value.type === 'global' ? canUpdateGlobalItems.value : true
})

const subtitle = computed(() => {
  const total = itemsStore.sortedItems.length
  if (searchQuery.value || selectedTagIds.value.length > 0) {
    return `${filteredItems.value.length} of ${total} item${total !== 1 ? 's' : ''}`
  }
  return total === 0 ? 'Catalog of all items you can add' : `${total} item${total !== 1 ? 's' : ''} in catalog`
})
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader title="Items" :subtitle="subtitle" icon="inventory">
        <template #actions>
          <q-btn
            color="secondary"
            unelevated
            no-caps
            icon="add"
            label="Add"
            class="gt-sm"
            aria-label="Add item"
            @click="openAddDialog"
          />
        </template>
      </PageHeader>

      <div class="sp-items__filters">
        <SearchInput v-model="searchQuery" @add="openAddDialog" />
        <div class="q-mt-sm">
          <TagFilter v-model="selectedTagIds" />
        </div>
      </div>

      <EmptyState
        v-if="filteredItems.length === 0"
        :icon="searchQuery ? 'search_off' : 'inventory_2'"
        :title="searchQuery ? 'No items found' : 'No items yet'"
        :hint="searchQuery ? 'Try a different search.' : 'Items in your catalog can be added to pantry or shopping list.'"
      >
        <template #action>
          <q-btn color="secondary" unelevated no-caps icon="add" label="Add item" @click="openAddDialog" />
        </template>
      </EmptyState>

      <!-- Mobile: cards -->
      <div v-else class="sp-items__cards lt-md">
        <q-card
          v-for="row in filteredItems"
          :key="row._id"
          flat
          bordered
          class="sp-item-card"
          @click="openEditDialog(row, 'name')"
        >
          <q-card-section class="row items-center q-gutter-md no-wrap">
            <div class="sp-item-card__icon">{{ row.icon || '📦' }}</div>
            <div class="col sp-item-card__body">
              <div class="sp-item-card__name">{{ row.name }}</div>
              <div class="sp-item-card__meta">
                <span>{{ row.defaultUnit || '-' }}</span>
                <span v-if="row.category" class="dot">·</span>
                <span v-if="row.category">{{ row.category }}</span>
                <q-badge v-if="row.type === 'global'" color="secondary" class="q-ml-xs">Global</q-badge>
              </div>
              <div v-if="row.tags && row.tags.length > 0" class="row q-gutter-xs q-mt-xs">
                <q-chip
                  v-for="tagId in row.tags.slice(0, 4)"
                  :key="tagId"
                  dense size="sm"
                  :style="{
                    backgroundColor: tagsStore.getTagById(tagId)?.color || '#6200EA',
                    color: getContrastColor(tagsStore.getTagById(tagId)?.color || '#6200EA')
                  }"
                >
                  {{ tagsStore.getTagById(tagId)?.name }}
                </q-chip>
              </div>
            </div>
            <q-icon name="chevron_right" color="grey-6" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Desktop: table -->
      <div v-if="filteredItems.length > 0" class="sp-items__table sp-table gt-sm">
        <q-table
          :rows="filteredItems"
          :columns="columns"
          row-key="_id"
          :rows-per-page-options="[10, 25, 50]"
          flat bordered
        >
          <template v-slot:body-cell-icon="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'icon')">
              <div class="sp-item-card__icon">{{ props.row.icon || '📦' }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-name="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'name')">
              <strong>{{ props.row.name }}</strong>
              <q-badge v-if="props.row.type === 'global'" color="secondary" class="q-ml-sm">Global</q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-defaultUnit="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'unit')">
              {{ props.row.defaultUnit || '-' }}
            </q-td>
          </template>
          <template v-slot:body-cell-category="props">
            <q-td :props="props" class="cursor-pointer" @click="openEditDialog(props.row, 'category')">
              {{ props.row.category || '-' }}
            </q-td>
          </template>
          <template v-slot:body-cell-tags="props">
            <q-td :props="props">
              <div v-if="props.row.tags && props.row.tags.length > 0" class="row q-gutter-xs">
                <q-chip
                  v-for="tagId in props.row.tags"
                  :key="tagId"
                  dense size="sm"
                  :style="{
                    backgroundColor: tagsStore.getTagById(tagId)?.color || '#6200EA',
                    color: getContrastColor(tagsStore.getTagById(tagId)?.color || '#6200EA'),
                    padding: '6px 12px'
                  }"
                >
                  <span v-if="tagsStore.getTagById(tagId)?.icon" style="margin-right: 6px">
                    {{ tagsStore.getTagById(tagId)?.icon }}
                  </span>
                  <span>{{ tagsStore.getTagById(tagId)?.name }}</span>
                </q-chip>
              </div>
              <span v-else class="text-grey-6">-</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense round color="primary" icon="edit" size="sm"
                :disable="!canEditItem(props.row)" @click="openEditDialog(props.row)">
                <q-tooltip>{{ canEditItem(props.row) ? 'Edit' : 'No permission' }}</q-tooltip>
              </q-btn>
              <q-btn flat dense round color="negative" icon="delete" size="sm"
                :disable="!canDeleteItem(props.row)" @click="deleteItem(props.row)">
                <q-tooltip>{{ canDeleteItem(props.row) ? 'Delete' : 'No permission' }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>

      <FabAdd class="lt-md" aria-label="Add item" @click="openAddDialog" />

      <AddItemDialog
        v-model="showAddDialog"
        title="Add New Item"
        :initial-data="initialFormData"
        :show-global-toggle="canCreateGlobalItems"
        @save="saveNewItem"
      />

      <AddItemDialog
        v-model="showEditDialog"
        title="Edit Item"
        :initial-data="initialFormData"
        :readonly-item-fields="!canEditItemFields"
        :focus-field="focusField"
        :show-delete-button="canDeleteCurrentItem"
        @save="saveEditedItem"
        @delete="handleDeleteFromDialog"
      />

      <ConfirmDialog
        v-model="showDeleteDialog"
        title="Delete Item"
        :message="deleteDialogMessage"
        type="danger"
        confirm-label="Delete"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-items__filters { margin-bottom: 16px; }

.sp-items__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-item-card {
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.sp-item-card:hover {
  border-color: rgba(47, 125, 95, 0.3);
  box-shadow: var(--sp-shadow-2);
}

.sp-item-card__icon {
  font-size: 1.4rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sp-primary-soft);
  border-radius: 10px;
  flex-shrink: 0;
}

.sp-item-card__body { min-width: 0; }

.sp-item-card__name {
  font-weight: 600;
  color: var(--sp-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-item-card__meta {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.sp-item-card__meta .dot { opacity: 0.5; }

.sp-items__table {
  background: var(--sp-surface);
  border-radius: var(--sp-r-md);
  overflow: hidden;
}

:deep(.sp-items__table .q-table thead) {
  background: var(--sp-surface-2);
}

:deep(.q-table .col-icon) { width: 64px; text-align: center; }
:deep(.q-table .col-unit) { width: 80px; }
:deep(.q-table .col-category) { width: 140px; }
:deep(.q-table .col-tags) { width: 220px; }
:deep(.q-table .col-actions) { width: 100px; }
</style>
