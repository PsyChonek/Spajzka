<template>
  <div class="sync-status">
    <q-badge v-if="!isOnline" color="orange" class="q-pa-sm">
      <q-icon name="cloud_off" size="xs" class="q-mr-xs" />
      Offline Mode
    </q-badge>
    <q-badge v-else-if="isAuthenticated && lastSynced" color="positive" class="q-pa-sm">
      <q-icon name="cloud_done" size="xs" class="q-mr-xs" />
      Synced
    </q-badge>
    <q-badge v-else color="grey-7" class="q-pa-sm">
      <q-icon name="storage" size="xs" class="q-mr-xs" />
      Local Storage
    </q-badge>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  lastSynced?: Date | null
  isAuthenticated?: boolean
}>()

const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.sync-status {
  display: inline-block;
}
</style>
