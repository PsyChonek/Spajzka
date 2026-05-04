<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

interface NavLink {
  to: string
  label: string
  icon: string
}

const { t } = useI18n({ useScope: 'global' })

const navLinks = computed<NavLink[]>(() => [
  { to: '/', label: t('nav.home'), icon: 'home' },
  { to: '/pantry', label: t('nav.pantry'), icon: 'kitchen' },
  { to: '/shopping', label: t('nav.shopping'), icon: 'shopping_cart' },
  { to: '/recipes', label: t('nav.recipes'), icon: 'restaurant_menu' },
  { to: '/meal-plan', label: t('nav.mealPlan'), icon: 'event' }
])

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
