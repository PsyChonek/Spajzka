<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GroupSelector from '@/components/GroupSelector.vue'
import BottomNav from '@/components/common/BottomNav.vue'

interface NavLink {
  to: string
  label: string
  icon: string
  primary: boolean
}

const navLinks: NavLink[] = [
  { to: '/', label: 'Home', icon: 'home', primary: true },
  { to: '/pantry', label: 'Pantry', icon: 'kitchen', primary: true },
  { to: '/shopping', label: 'Shopping', icon: 'shopping_cart', primary: true },
  { to: '/recipes', label: 'Recipes', icon: 'restaurant_menu', primary: true },
  { to: '/meal-plan', label: 'Meal Plan', icon: 'event', primary: true },
  { to: '/items', label: 'Items', icon: 'inventory', primary: false },
  { to: '/history', label: 'History', icon: 'history', primary: false },
  { to: '/groups', label: 'Groups', icon: 'group', primary: false },
  { to: '/profile', label: 'Profile', icon: 'account_circle', primary: false }
]

const drawer = ref(false)
const route = useRoute()
const router = useRouter()

const navigateTo = (to: string) => {
  if (route.path !== to) router.push(to)
  drawer.value = false
}
</script>

<template>
  <q-layout view="hHh lpR fFf" class="sp-shell">
    <q-header elevated class="sp-shell__header bg-primary text-white">
      <q-toolbar class="sp-shell__toolbar">
        <!-- Mobile/tablet menu button — hidden on desktop -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="q-mr-sm lt-md"
          @click="drawer = !drawer"
        />

        <q-toolbar-title class="sp-shell__title" @click="navigateTo('/')">
          <span class="sp-shell__brand">Špajzka</span>
        </q-toolbar-title>

        <!-- Desktop primary nav: lives in the middle/right of the toolbar -->
        <div class="gt-sm sp-shell__navlinks">
          <q-btn
            v-for="link in navLinks.filter(l => l.primary)"
            :key="link.to"
            flat
            no-caps
            :to="link.to"
            :label="link.label"
            :icon="link.icon"
            class="sp-shell__navbtn"
            :class="{ 'sp-shell__navbtn--active': route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to + '/')) }"
          />
        </div>

        <!-- Spacer pushes group selector + drawer toggle to the right -->
        <q-space class="gt-sm" />

        <!-- Group selector lives at the far right, separated from nav links -->
        <GroupSelector variant="toolbar" class="sp-shell__group" />

        <!-- Desktop: secondary destinations live in a right-side drawer toggle -->
        <q-btn
          flat
          dense
          round
          icon="more_vert"
          aria-label="More"
          class="q-ml-sm gt-sm"
          @click="drawer = !drawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      :width="280"
      :breakpoint="0"
      bordered
      class="sp-shell__drawer"
      side="left"
      overlay
    >
      <div class="sp-shell__drawer-header">
        <div class="sp-shell__drawer-brand">Špajzka</div>
        <div class="sp-shell__drawer-tag">Pantry &amp; shopping</div>
      </div>
      <q-scroll-area class="sp-shell__drawer-scroll">
        <q-list padding>
          <q-item-label header>Group</q-item-label>
          <GroupSelector variant="drawer" />

          <q-separator class="q-my-md" />

          <q-item-label header>Navigate</q-item-label>
          <q-item
            v-for="link in navLinks"
            :key="link.to"
            clickable
            v-ripple
            :active="route.path === link.to"
            active-class="sp-shell__drawer-item--active"
            @click="navigateTo(link.to)"
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>{{ link.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <slot />
    </q-page-container>

    <BottomNav />
  </q-layout>
</template>

<style scoped>
.sp-shell__header {
  background: linear-gradient(180deg, #2D3748 0%, #1A202C 100%) !important;
  padding-top: env(safe-area-inset-top, 0px);
}

.sp-shell__toolbar {
  min-height: 56px;
  gap: 8px;
}

.sp-shell__title {
  cursor: pointer;
  flex: 0 0 auto;
  min-width: 0;
}

.sp-shell__brand {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: 1.25rem;
}

.sp-shell__navlinks {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 24px;
}

.sp-shell__navbtn {
  font-weight: 600;
  opacity: 0.78;
  border-radius: 10px;
  padding: 4px 12px;
}

.sp-shell__navbtn--active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
  color: #FBD38D;
}

.sp-shell__group {
  flex-shrink: 0;
}

.sp-shell__drawer-header {
  padding: 20px 20px 12px;
  background: linear-gradient(160deg, #2D3748 0%, #1A202C 100%);
  color: white;
  padding-top: calc(20px + env(safe-area-inset-top, 0px));
}

.sp-shell__drawer-brand {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: -0.01em;
}

.sp-shell__drawer-tag {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 2px;
}

.sp-shell__drawer-scroll {
  height: calc(100% - 80px);
}

:deep(.sp-shell__drawer-item--active) {
  background: var(--sp-secondary-soft);
  color: var(--sp-secondary);
  font-weight: 600;
}

:deep(.sp-shell__drawer-item--active .q-icon) {
  color: var(--sp-secondary);
}

/* Toolbar overflow safety */
:deep(.sp-shell__toolbar) {
  overflow: hidden;
}
</style>
