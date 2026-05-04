<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Notify } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useMealPlanStore } from '@/stores/mealPlanStore'

const { t } = useI18n({ useScope: 'global' })
import { isOnline } from '@/utils/network'
import BaseDialog from './BaseDialog.vue'
import EmptyState from './common/EmptyState.vue'
import type { AggregatedIngredient, ShoppingPreviewResponse } from '@shared/api-client'
import { formatQuantity } from '@shared/units'

const mealPlanStore = useMealPlanStore()

interface Props {
  modelValue: boolean
  from: string
  to: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'generated'): void
}>()

const loading = ref(false)
const generating = ref(false)
const previewData = ref<ShoppingPreviewResponse | null>(null)
const missingOnly = ref(true)

const online = computed(() => isOnline())

const aggregated = computed<AggregatedIngredient[]>(() => previewData.value?.aggregated ?? [])
const skippedFreeText = computed(() => previewData.value?.skippedFreeText ?? [])

const skippedNames = computed(() =>
  skippedFreeText.value.map((s) => s.itemName).filter(Boolean).join(', ')
)

const willAddCount = computed(() =>
  aggregated.value.filter((item) => (item.toAdd ?? 0) > 0).length
)

const subtitle = computed(() => `${props.from} → ${props.to}`)

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) await runPreview()
    else previewData.value = null
  }
)

watch(missingOnly, async () => {
  if (props.modelValue) await runPreview()
})

async function runPreview() {
  if (!online.value) return
  loading.value = true
  previewData.value = null
  try {
    previewData.value = await mealPlanStore.previewShopping({
      from: props.from,
      to: props.to,
      missingOnly: missingOnly.value
    })
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  if (!online.value || willAddCount.value === 0) return
  generating.value = true
  try {
    const result = await mealPlanStore.generateShopping({
      from: props.from,
      to: props.to,
      missingOnly: missingOnly.value
    })
    if (result) {
      Notify.create({
        type: 'positive',
        message: `Added ${result.addedCount ?? 0} item(s) to shopping list`,
        timeout: 2500
      })
      emit('generated')
      emit('update:modelValue', false)
    }
  } finally {
    generating.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="t('shoppingDialog.title')"
    :subtitle="subtitle"
    header-icon="shopping_cart"
    header-icon-color="secondary"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <q-banner
      v-if="!online"
      class="sp-preview__banner sp-preview__banner--offline"
      rounded
      dense
    >
      <template #avatar>
        <q-icon name="cloud_off" />
      </template>
      {{ t('errors.networkError') }}
    </q-banner>

    <q-toggle
      v-model="missingOnly"
      :label="t('shoppingDialog.subtractPantry')"
      color="primary"
      :disable="loading"
      class="q-mb-md"
    />

    <q-linear-progress v-if="loading" indeterminate color="primary" class="q-mb-md" />

    <template v-if="!loading && aggregated.length > 0">
      <ul class="sp-preview__list">
        <li
          v-for="item in aggregated"
          :key="item.itemId"
          class="sp-preview__item"
        >
          <span class="sp-preview__icon">{{ item.icon || '📦' }}</span>
          <div class="sp-preview__body">
            <div class="sp-preview__name">{{ item.itemName }}</div>
            <div class="sp-preview__meta">
              Need {{ formatQuantity(item.quantity ?? 0, item.unit ?? '', { promote: true }) }}
              <span v-if="(item.inPantry ?? 0) > 0" class="sp-preview__meta-pantry">
                · {{ formatQuantity(item.inPantry ?? 0, item.unit ?? '', { promote: true }) }} in pantry
              </span>
            </div>
          </div>
          <span
            class="sp-preview__badge"
            :class="(item.toAdd ?? 0) > 0 ? 'sp-preview__badge--add' : 'sp-preview__badge--none'"
          >
            +{{ formatQuantity(item.toAdd ?? 0, item.unit ?? '', { promote: true }) }}
          </span>
        </li>
      </ul>
    </template>

    <EmptyState
      v-else-if="!loading"
      icon="check_circle"
      :title="t('shoppingDialog.nothingToAdd')"
      hint=""
    />

    <q-banner
      v-if="skippedFreeText.length > 0"
      class="sp-preview__banner sp-preview__banner--warn q-mt-md"
      rounded
      dense
    >
      <template #avatar>
        <q-icon name="info" />
      </template>
      <div class="sp-preview__warn-title">
        {{ skippedFreeText.length }} ingredient{{ skippedFreeText.length === 1 ? '' : 's' }} can't be added automatically
      </div>
      <div class="sp-preview__warn-list">{{ skippedNames }}</div>
    </q-banner>

    <template #footer>
      <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="handleClose" />
      <q-btn
        unelevated
        no-caps
        color="secondary"
        text-color="white"
        icon="shopping_cart"
        :label="willAddCount === 0 ? t('shoppingDialog.nothingToAdd') : t('shopping.addItem')"
        :loading="generating"
        :disable="!online || willAddCount === 0 || loading"
        @click="handleGenerate"
      />
    </template>
  </BaseDialog>
</template>

<style scoped>
.sp-preview__banner {
  border-radius: var(--sp-r-md);
  margin-bottom: 12px;
}

.sp-preview__banner--offline {
  background: var(--sp-secondary-soft);
  color: var(--sp-text);
}

.sp-preview__banner--warn {
  background: #FFF7ED;
  color: var(--sp-text);
  border: 1px solid #FED7AA;
}

.sp-preview__warn-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.sp-preview__warn-list {
  font-size: 0.85rem;
  color: var(--sp-text-muted);
}

.sp-preview__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-preview__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--sp-surface-2);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
}

.sp-preview__icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.sp-preview__body {
  flex: 1;
  min-width: 0;
}

.sp-preview__name {
  font-weight: 600;
  color: var(--sp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-preview__meta {
  font-size: 0.8rem;
  color: var(--sp-text-muted);
  margin-top: 2px;
}

.sp-preview__meta-pantry {
  color: var(--positive, #2F855A);
}

.sp-preview__badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: var(--sp-r-pill);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.sp-preview__badge--add {
  background: rgba(47, 133, 90, 0.12);
  color: #276749;
}

.sp-preview__badge--none {
  background: var(--sp-surface);
  color: var(--sp-text-soft);
  border: 1px solid var(--sp-border);
}
</style>
