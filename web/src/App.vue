<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'
import { useAuthStore } from '@/stores/authStore'
import NavBar from '@/components/NavBar.vue'

// Initialize online sync once at the app level
useOnlineSync()

const authStore = useAuthStore()

// Initialize auth on app mount
onMounted(async () => {
  await authStore.initialize()
})
</script>

<template>
  <div id="app">
    <q-layout view="hHh lpR fFf">
      <NavBar />

      <q-page-container>
        <RouterView />
      </q-page-container>
    </q-layout>
  </div>
</template>