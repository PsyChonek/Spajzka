<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'
import { useAuthStore } from '@/stores/authStore'
import AppShell from '@/components/common/AppShell.vue'

useOnlineSync()

const authStore = useAuthStore()
const route = useRoute()

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
