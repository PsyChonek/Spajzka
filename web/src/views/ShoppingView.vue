<script setup lang="ts">
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import { usePantryStore } from '@/stores/pantryStore'
import { CreatePantryItemRequest, CreateShoppingItemRequest, type ShoppingItem } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FabAdd from '@/components/common/FabAdd.vue'
import ItemSuggestions from '@/components/ItemSuggestions.vue'
import AddItemDialog, { type ItemFormData } from '@/components/AddItemDialog.vue'
import SearchInput from '@/components/SearchInput.vue'
import TagFilter from '@/components/TagFilter.vue'
import { matchesQuery, normalizeForSearch } from '@/utils/search'
import { formatQuantity } from '@shared/units'

const shoppingStore = useShoppingStore()
const itemsStore = useItemsStore()
const pantryStore = usePantryStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showAddDialog = ref(false)
const initialFormData = ref<Partial<ItemFormData>>({})

const filteredItems = computed(() => {
  let filtered = shoppingStore.sortedItems
  if (searchQuery.value) {
    filtered = filtered.filter(item => {
      const u = itemsStore.sortedItems.find((i: any) => i._id === item.itemId)
      return matchesQuery(searchQuery.value, item.name, ...((u?.searchNames as string[] | undefined) ?? []))
    })
  }
  if (selectedTagIds.value.length > 0) {
    filtered = filtered.filter(s => {
      const u = itemsStore.sortedItems.find((i: any) => i._id === s.itemId)
      if (!u || !u.tags || u.tags.length === 0) return false
      return u.tags.some((t: string) => selectedTagIds.value.includes(t))
    })
  }
  return filtered
})

const pendingItems = computed(() => filteredItems.value.filter((i: any) => !i.completed))
const completedItems = computed(() => filteredItems.value.filter((i: any) => i.completed))

const suggestedItems = computed(() => {
  if (!searchQuery.value) return []
  const keys = new Set(
    shoppingStore.sortedItems.map(i => (i.name ? normalizeForSearch(i.name).trim() : '')).filter(Boolean)
  )
  return itemsStore.sortedItems
    .filter(i => {
      const k = normalizeForSearch(i.name).trim()
      return matchesQuery(searchQuery.value, i.name, i.category, ...((i.searchNames as string[] | undefined) ?? [])) && !keys.has(k)
    })
    .slice(0, 5)
})

const openAddDialog = () => {
  initialFormData.value = { name: searchQuery.value, unitType: 'count', defaultUnit: 'pcs', category: '' }
  showAddDialog.value = true
}

const addFromSuggestion = async (item: any) => {
  await shoppingStore.addItem({
    itemId: item._id,
    itemType: item.type as CreateShoppingItemRequest.itemType,
    quantity: 1
  })
  itemsStore.markItemsAsUsed([item._id])
  searchQuery.value = ''
}

const saveNewItem = async (data: ItemFormData) => {
  await itemsStore.addGroupItem({
    name: data.name,
    category: data.category || 'Other',
    icon: data.icon || '📦',
    unitType: (data.unitType || 'count') as any,
    defaultUnit: data.defaultUnit || 'pcs'
  })
  const created = itemsStore.sortedItems.find(i => i.name === data.name && i.type === 'group')
  if (created) {
    await shoppingStore.addItem({ itemId: created._id!, itemType: CreateShoppingItemRequest.itemType.GROUP, quantity: 1 })
    itemsStore.markItemsAsUsed([created._id!])
  }
  searchQuery.value = ''
}

const toggleItem = async (item: ShoppingItem) => {
  if (!item._id) return
  const wasCompleted = !!item.completed
  await shoppingStore.toggleItem(item._id)
  // When checking off (becoming completed), auto-add to pantry with undo option.
  // Unchecking later (after the undo window) leaves the pantry entry untouched.
  if (!wasCompleted && item.itemId && item.itemType) {
    const shoppingItemId = item._id
    const itemName = item.name || 'Item'
    const pantryItem = await pantryStore.addItem({
      itemId: item.itemId,
      itemType: item.itemType as unknown as CreatePantryItemRequest.itemType,
      quantity: item.quantity || 1
    })
    Notify.create({
      type: 'positive',
      message: `${itemName} moved to pantry`,
      timeout: 5000,
      actions: [
        {
          label: 'Undo',
          color: 'white',
          handler: async () => {
            if (pantryItem?._id) await pantryStore.deleteItem(pantryItem._id)
            await shoppingStore.toggleItem(shoppingItemId)
          }
        }
      ]
    })
  }
}

const incrementQuantity = (item: ShoppingItem) =>
  item._id && shoppingStore.updateItem(item._id, { quantity: (item.quantity || 1) + 1 })

const decrementQuantity = (item: ShoppingItem) => {
  if (item._id && (item.quantity || 1) > 1) {
    shoppingStore.updateItem(item._id, { quantity: (item.quantity || 1) - 1 })
  }
}

const updateQuantity = async (item: ShoppingItem, val: number | string) => {
  if (!item._id) return
  const q = typeof val === 'string' ? parseInt(val, 10) : val
  if (isNaN(q) || q < 1) {
    item.quantity = item.quantity || 1
    return
  }
  await shoppingStore.updateItem(item._id, { quantity: q })
}

const subtitle = computed(() => {
  const pending = pendingItems.value.length
  const total = filteredItems.value.length
  if (pending === 0 && total === 0) return 'Build your shopping list'
  if (pending === 0) return `All ${total} item${total !== 1 ? 's' : ''} bought`
  return `${pending} of ${total} item${total !== 1 ? 's' : ''} to buy`
})
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader title="Shopping" :subtitle="subtitle" icon="shopping_cart">
        <template #actions>
          <q-btn
            color="secondary"
            unelevated
            no-caps
            icon="add"
            label="Add"
            class="gt-sm"
            aria-label="Add to shopping list"
            @click="openAddDialog"
          />
        </template>
      </PageHeader>

      <div class="sp-shopping__filters">
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

      <EmptyState
        v-if="filteredItems.length === 0"
        :icon="searchQuery ? 'search_off' : 'shopping_cart'"
        :title="searchQuery ? 'No items found' : 'Shopping list is empty'"
        :hint="searchQuery ? 'Try a different search or tap Add to create one.' : 'Tap the + button to add what you need to buy.'"
      >
        <template #action>
          <q-btn color="secondary" unelevated no-caps icon="add" label="Add item" @click="openAddDialog" />
        </template>
      </EmptyState>

      <!-- Pending list -->
      <div v-if="pendingItems.length > 0" class="sp-shopping__list">
        <q-card
          v-for="row in pendingItems"
          :key="row._id"
          flat
          bordered
          class="sp-shop-card"
        >
          <q-card-section class="row items-center q-gutter-sm no-wrap">
            <q-checkbox
              :model-value="!!row.completed"
              @update:model-value="toggleItem(row)"
              size="lg"
              color="primary"
            />
            <div class="sp-shop-card__icon">{{ row.icon || '📦' }}</div>
            <div class="col sp-shop-card__body" @click="toggleItem(row)">
              <div class="sp-shop-card__name">{{ row.name || 'Loading...' }}</div>
            </div>
            <div class="sp-shop-card__qty">
              <q-btn
                flat dense round size="sm" icon="remove" color="grey-7"
                :disable="(row.quantity || 1) <= 1"
                @click.stop="decrementQuantity(row)"
              />
              <q-input
                :model-value="row.quantity || 1"
                @update:model-value="(v) => v !== null && updateQuantity(row, v)"
                type="number" min="1" dense borderless
                input-class="sp-shop-card__qty-input"
                class="sp-shop-card__qty-wrapper"
                @click.stop
              />
              <q-btn
                flat dense round size="sm" icon="add" color="primary"
                @click.stop="incrementQuantity(row)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Completed list -->
      <details v-if="completedItems.length > 0" class="sp-shopping__completed">
        <summary>
          <q-icon name="check_circle" color="positive" />
          {{ completedItems.length }} bought
        </summary>
        <div class="sp-shopping__list q-mt-sm">
          <q-card
            v-for="row in completedItems"
            :key="row._id"
            flat
            bordered
            class="sp-shop-card sp-shop-card--done"
          >
            <q-card-section class="row items-center q-gutter-sm no-wrap">
              <q-checkbox
                :model-value="!!row.completed"
                @update:model-value="toggleItem(row)"
                size="lg"
                color="positive"
              />
              <div class="sp-shop-card__icon sp-shop-card__icon--muted">{{ row.icon || '📦' }}</div>
              <div class="col sp-shop-card__body" @click="toggleItem(row)">
                <div class="sp-shop-card__name sp-shop-card__name--done">{{ row.name || 'Loading...' }}</div>
              </div>
              <div class="text-grey-6 q-mr-sm">{{ formatQuantity(row.quantity || 1, row.defaultUnit || 'pcs', { promote: true }) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </details>

      <FabAdd class="lt-md" aria-label="Add to shopping list" @click="openAddDialog" />

      <AddItemDialog
        v-model="showAddDialog"
        title="Add New Item"
        :initial-data="initialFormData"
        :show-pantry-fields="false"
        @save="saveNewItem"
      />
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-shopping__filters { margin-bottom: 16px; }

.sp-shopping__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-shop-card {
  transition: border-color 0.18s, box-shadow 0.18s;
}

.sp-shop-card:hover {
  border-color: rgba(47, 125, 95, 0.3);
}

.sp-shop-card--done {
  background: var(--sp-surface-2);
}

.sp-shop-card__icon {
  font-size: 1.4rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sp-primary-soft);
  border-radius: 8px;
  flex-shrink: 0;
}

.sp-shop-card__icon--muted { background: transparent; opacity: 0.45; }

.sp-shop-card__body { cursor: pointer; min-width: 0; }

.sp-shop-card__name {
  font-weight: 600;
  color: var(--sp-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-shop-card__name--done {
  text-decoration: line-through;
  color: var(--sp-text-muted);
}

.sp-shop-card__qty {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.sp-shop-card__qty-wrapper {
  width: 44px;
  min-width: 44px;
}

.sp-shop-card__qty-wrapper :deep(.q-field__control) {
  height: 28px;
  min-height: 28px;
}

.sp-shop-card__qty-wrapper :deep(input.sp-shop-card__qty-input) {
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0;
}

.sp-shop-card__qty-wrapper :deep(input::-webkit-outer-spin-button),
.sp-shop-card__qty-wrapper :deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.sp-shop-card__qty-wrapper :deep(input[type=number]) {
  -moz-appearance: textfield;
}

.sp-shopping__completed {
  margin-top: 24px;
  border-top: 1px solid var(--sp-divider);
  padding-top: 16px;
}

.sp-shopping__completed summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--sp-text-muted);
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.sp-shopping__completed summary::-webkit-details-marker { display: none; }
</style>
