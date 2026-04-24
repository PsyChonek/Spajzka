<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

interface NavLink {
  to: string
  label: string
  icon: string
}

const navLinks: NavLink[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/pantry', label: 'Pantry', icon: 'kitchen' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping_cart' },
  { to: '/recipes', label: 'Recipes', icon: 'restaurant_menu' },
  { to: '/meal-plan', label: 'Meal Plan', icon: 'event' }
]

const route = useRoute()
const router = useRouter()

const isActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

const navigateTo = (to: string) => {
  if (route.path !== to) router.push(to)
}
</script>

<template>
  <nav class="sp-bottom-nav lt-md" aria-label="Primary navigation">
    <button
      v-for="link in navLinks"
      :key="link.to"
      type="button"
      class="sp-bottom-nav__btn"
      :class="{ 'sp-bottom-nav__btn--active': isActive(link.to) }"
      :aria-current="isActive(link.to) ? 'page' : undefined"
      @click="navigateTo(link.to)"
    >
      <q-icon :name="link.icon" />
      <span>{{ link.label }}</span>
    </button>
  </nav>
</template>
