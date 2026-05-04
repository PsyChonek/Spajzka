<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'
import { useAuthStore } from '@/stores/authStore'
import { useItemsStore } from '@/stores/itemsStore'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useRecipesStore } from '@/stores/recipesStore'
import { useMealPlanStore } from '@/stores/mealPlanStore'
import { useTagsStore } from '@/stores/tagsStore'
import { setInterfaceLocale, type SupportedLocale } from '@/services/i18n'
import AppShell from '@/components/common/AppShell.vue'

useOnlineSync()

const authStore = useAuthStore()
const route = useRoute()

// Keep i18n + Quasar lang in sync with the user's interfaceLanguage preference
watch(
  () => authStore.user?.interfaceLanguage,
  (loc) => {
    if (loc) setInterfaceLocale(loc as SupportedLocale)
  }
)

// Re-fetch translatable content when the user's itemsLanguage changes — the
// API localizes responses based on this field, so without a refetch the store
// keeps names from the previous locale.
watch(
  () => authStore.user?.itemsLanguage,
  (next, prev) => {
    if (!next || next === prev) return
    if (!navigator.onLine) return
    useItemsStore().fetchItems()
    usePantryStore().fetchItems()
    useShoppingStore().fetchItems()
    useRecipesStore().fetchItems()
    useMealPlanStore().fetchItems()
    useTagsStore().fetchTags?.()
  }
)

onMounted(async () => {
  await authStore.initialize()
})
</script>

<template>
  <div id="app">
    <!-- OAuth consent page renders standalone (no shell) -->
    <RouterView v-if="route.meta?.standalone" />
    <AppShell v-else>
      <RouterView />
    </AppShell>
  </div>
</template>
