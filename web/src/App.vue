<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'
import { useAuthStore } from '@/stores/authStore'
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
