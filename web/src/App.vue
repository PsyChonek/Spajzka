<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useOnlineSync } from '@/composables/useOnlineSync'

// Initialize online sync once at the app level
useOnlineSync()
</script>

<template>
  <div id="app">
    <q-layout view="hHh lpR fFf">
      <q-header elevated class="bg-primary text-white">
        <q-toolbar>
          <q-toolbar-title>
            Spajzka
          </q-toolbar-title>
          <q-btn flat to="/" label="Home" />
          <q-btn flat to="/pantry-list" label="Pantry List" />
          <q-btn flat to="/shopping-list" label="Shopping List" />
          <q-btn flat to="/auth-test" label="Auth Test" />
          <q-btn flat to="/examples" label="Examples" />
        </q-toolbar>
      </q-header>

      <q-page-container>
        <RouterView />
      </q-page-container>
    </q-layout>
  </div>
</template>