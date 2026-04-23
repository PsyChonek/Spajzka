<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useMealPlanStore } from '@/stores/mealPlanStore'
import { isOnline } from '@/utils/network'
import type { AggregatedIngredient, ShoppingPreviewResponse } from '@shared/api-client'

const $q = useQuasar()
const mealPlanStore = useMealPlanStore()

// ---- Props & emits ----

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

// ---- State ----

const loading = ref(false)
const generating = ref(false)
const previewData = ref<ShoppingPreviewResponse | null>(null)
const missingOnly = ref(true)

// ---- Computed ----

const online = computed(() => isOnline())

const aggregated = computed<AggregatedIngredient[]>(() => previewData.value?.aggregated ?? [])
const skippedFreeText = computed(() => previewData.value?.skippedFreeText ?? [])

const willAddCount = computed(() =>
  aggregated.value.filter((item) => (item.toAdd ?? 0) > 0).length
)

// ---- Watchers ----

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await runPreview()
    } else {
      previewData.value = null
    }
  }
)

watch(missingOnly, async () => {
  if (props.modelValue) {
    await runPreview()
  }
})

// ---- Actions ----

async function runPreview() {
  if (!online.value) return

  loading.value = true
  previewData.value = null
  try {
    const result = await mealPlanStore.previewShopping({
      from: props.from,
      to: props.to,
      missingOnly: missingOnly.value
    })
    previewData.value = result
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
      $q.notify({
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
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :full-width="$q.screen.lt.md"
    :maximized="$q.screen.lt.sm"
  >
    <q-card
      :style="$q.screen.lt.sm
        ? 'height: 100vh; max-height: 100vh; display: flex; flex-direction: column'
        : 'width: 100%; max-width: 600px'"
    >
      <q-card-section>
        <div class="text-h6">Generate Shopping List</div>
        <div class="text-caption text-grey-7">
          From {{ from }} to {{ to }}
        </div>
      </q-card-section>

      <!-- Offline banner -->
      <q-banner
        v-if="!online"
        class="bg-warning text-white q-mx-md q-mb-sm"
        rounded
        dense
      >
        <template #avatar>
          <q-icon name="cloud_off" />
        </template>
        Shopping generation requires an online connection
      </q-banner>

      <!-- Options row -->
      <q-card-section class="q-pt-none q-pb-sm">
        <q-toggle
          v-model="missingOnly"
          label="Subtract pantry stock (only add what's missing)"
          color="primary"
          :disable="loading"
        />
      </q-card-section>

      <!-- Loading -->
      <q-linear-progress v-if="loading" indeterminate color="primary" />

      <!-- Preview list -->
      <q-card-section
        class="q-pt-none"
        :style="$q.screen.lt.sm ? 'flex: 1; overflow-y: auto' : 'max-height: 50vh; overflow-y: auto'"
      >
        <template v-if="!loading && aggregated.length > 0">
          <q-list separator>
            <q-item
              v-for="item in aggregated"
              :key="item.itemId"
              dense
            >
              <!-- Icon -->
              <q-item-section avatar style="min-width: 36px">
                <span style="font-size: 1.3rem">{{ item.icon || '📦' }}</span>
              </q-item-section>

              <!-- Name & quantity -->
              <q-item-section>
                <q-item-label>{{ item.itemName }}</q-item-label>
                <q-item-label caption>
                  Need {{ item.quantity }} {{ item.unit }}
                  <span v-if="(item.inPantry ?? 0) > 0" class="q-ml-xs">
                    · in pantry: {{ item.inPantry }}
                  </span>
                </q-item-label>
              </q-item-section>

              <!-- To add badge -->
              <q-item-section side>
                <q-badge
                  :color="(item.toAdd ?? 0) > 0 ? 'positive' : 'grey-5'"
                  :label="`+${item.toAdd ?? 0} ${item.unit ?? ''}`"
                />
              </q-item-section>

              <!-- Pantry match indicator -->
              <q-item-section side v-if="(item.inPantry ?? 0) > 0">
                <q-icon name="kitchen" color="positive" size="16px">
                  <q-tooltip>Already in pantry</q-tooltip>
                </q-icon>
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <template v-else-if="!loading">
          <div class="column items-center q-py-lg text-grey-6">
            <q-icon name="check_circle" size="2.5rem" class="q-mb-sm" />
            <div class="text-body1">No ingredients to add for this period</div>
          </div>
        </template>

        <!-- Skipped free-text ingredients warning -->
        <q-banner
          v-if="skippedFreeText.length > 0"
          class="bg-orange-1 q-mt-md"
          rounded
          dense
        >
          <template #avatar>
            <q-icon name="info" color="orange" />
          </template>
          <div class="text-body2">
            <strong>{{ skippedFreeText.length }} ingredient(s) can't be added automatically (no matching item):</strong>
            <div class="text-caption q-mt-xs">
              {{ skippedFreeText.map((s) => s.itemName).filter(Boolean).join(', ') }}
            </div>
          </div>
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey-7" @click="handleClose" />
        <q-btn
          color="secondary"
          icon="shopping_cart"
          :label="`Add ${willAddCount} item(s) to shopping`"
          :loading="generating"
          :disable="!online || willAddCount === 0 || loading"
          @click="handleGenerate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
