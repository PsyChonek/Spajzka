<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groupsStore'
import { usePantryStore } from '@/stores/pantryStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useItemsStore } from '@/stores/itemsStore'
import { useRecipesStore } from '@/stores/recipesStore'
import { useAuthStore } from '@/stores/authStore'
import GroupSelector from '@/components/GroupSelector.vue'
import SyncStatusBadge from '@/components/SyncStatusBadge.vue'

const drawer = ref(false)
const router = useRouter()
const groupsStore = useGroupsStore()
const pantryStore = usePantryStore()
const shoppingStore = useShoppingStore()
const itemsStore = useItemsStore()
const recipesStore = useRecipesStore()
const authStore = useAuthStore()

// Compute the most recent sync time across all stores
const lastSynced = computed(() => {
  const times = [
    pantryStore.lastSynced,
    shoppingStore.lastSynced,
    itemsStore.lastSynced,
    recipesStore.lastSynced,
    groupsStore.lastSynced
  ]
    .filter(Boolean)
    .map(t => typeof t === 'string' ? new Date(t) : t) as Date[]

  if (times.length === 0) return null
  return new Date(Math.max(...times.map(d => d.getTime())))
})

interface NavLink {
  to: string
  label: string
  icon?: string
}

const navLinks: NavLink[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/pantry', label: 'Pantry', icon: 'kitchen' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping_cart' },
  { to: '/items', label: 'Items', icon: 'inventory' },
  { to: '/recipes', label: 'Recipes', icon: 'restaurant_menu' },
  { to: '/groups', label: 'Groups', icon: 'group' },
  { to: '/profile', label: 'Profile', icon: 'lock' }
]

const navigateTo = (path: string) => {
  router.push(path)
  drawer.value = false
}

// Note: App.vue handles auth initialization on mount
</script>

<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        class="q-mr-sm lt-sm"
        @click="drawer = !drawer"
      />

      <q-toolbar-title class="toolbar-title">
        Spajzka
      </q-toolbar-title>

      <!-- Sync Status Badge - Desktop (left side after title) -->
      <div class="gt-xs q-ml-md">
        <SyncStatusBadge
          :last-synced="lastSynced"
          :is-authenticated="authStore.isAuthenticated"
        />
      </div>

      <!-- Group Selector -->
      <GroupSelector variant="toolbar" />

      <!-- Sync Status Badge - Mobile (right side) -->
      <div class="lt-sm q-ml-sm">
        <SyncStatusBadge
          :last-synced="lastSynced"
          :is-authenticated="authStore.isAuthenticated"
        />
      </div>

      <!-- Desktop Navigation -->
      <div class="gt-xs nav-links">
        <q-btn
          v-for="link in navLinks"
          :key="link.to"
          flat
          :to="link.to"
          :label="link.label"
          :class="{ 'active-nav-btn': $route.path === link.to }"
        />
      </div>
    </q-toolbar>
  </q-header>

  <!-- Mobile Drawer -->
  <q-drawer
    v-model="drawer"
    :width="250"
    :breakpoint="800"
    bordered
    class="bg-grey-2"
  >
    <q-scroll-area class="fit">
      <q-list padding>
        <q-item-label header class="text-weight-bold">
          Group
        </q-item-label>

        <!-- Group Selector in Drawer -->
        <GroupSelector variant="drawer" />

        <q-separator class="q-my-md" />

        <q-item-label header class="text-weight-bold">
          Navigation
        </q-item-label>

        <q-item
          v-for="link in navLinks"
          :key="link.to"
          clickable
          v-ripple
          @click="navigateTo(link.to)"
          :active="$route.path === link.to"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar v-if="link.icon">
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>
            {{ link.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<style scoped>
.active-nav-btn {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
               0 0 20px rgba(255, 255, 255, 0.6),
               0 0 30px rgba(255, 255, 255, 0.4);
  font-weight: 600;
}

.toolbar-title {
  flex-shrink: 0;
  min-width: 0;
}

.nav-links {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Ensure toolbar children don't overflow */
:deep(.q-toolbar) {
  overflow: hidden;
}
</style>
