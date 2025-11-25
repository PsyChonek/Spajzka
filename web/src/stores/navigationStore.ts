import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const lastRoute = ref<string>('/')

  function setLastRoute(path: string) {
    // Only save if it's not the root path (to avoid redirecting away from home unnecessarily)
    if (path !== '/') {
      lastRoute.value = path
    }
  }

  function getLastRoute(): string {
    return lastRoute.value
  }

  function clearLastRoute() {
    lastRoute.value = '/'
  }

  return {
    lastRoute,
    setLastRoute,
    getLastRoute,
    clearLastRoute
  }
}, {
  persist: true
})
