<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GroupSelector from '@/components/GroupSelector.vue'

const drawer = ref(false)
const router = useRouter()

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
  { to: '/cook', label: 'Cook', icon: 'soup_kitchen' },
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

      <!-- Group Selector -->
      <GroupSelector variant="toolbar" />

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
