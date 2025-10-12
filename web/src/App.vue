<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'
import NavBar from '@/components/NavBar.vue'

// Initialize online sync once at the app level
useOnlineSync()
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