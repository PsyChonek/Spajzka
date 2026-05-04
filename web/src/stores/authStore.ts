import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  AuthenticationService,
  type User,
  type RegisterRequest,
  type LoginRequest,
  ApiError
} from '@shared/api-client'
import { Notify } from 'quasar'
import { i18n } from '@/services/i18n'

const t = (key: string, named?: Record<string, unknown>) =>
  i18n.global.t(key, (named ?? {}) as any) as string

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)
  const initialized = ref(false)
  const initializing = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAnonymous = computed(() => user.value?.isAnonymous === true)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.name || user.value?.email || 'User')

  // Helper function to check if user has a specific global permission
  const hasGlobalPermission = (permission: string) => {
    return user.value?.globalPermissions?.includes(permission) || false
  }

  // Register new user
  async function register(data: RegisterRequest) {
    loading.value = true
    try {
      const response = await AuthenticationService.postApiAuthRegister(data)

      // Store token and user
      token.value = response.token!
      user.value = response.user!
      localStorage.setItem('auth_token', response.token!)

      // Refresh all stores after successful registration to get latest data
      const { useStoreRefresh } = await import('@/composables/useStoreRefresh')
      const { refreshAllStores } = useStoreRefresh()
      await refreshAllStores()

      Notify.create({
        type: 'positive',
        message: t('auth.registerSuccess'),
        timeout: 2000
      })

      return true
    } catch (error: any) {
      console.error('Registration failed:', error)

      const message = error instanceof ApiError ? error.body?.message : t('auth.registerFailed')
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  // Login
  async function login(data: LoginRequest) {
    loading.value = true
    try {
      const response = await AuthenticationService.postApiAuthLogin(data)

      // Store token and user
      token.value = response.token!
      user.value = response.user!
      localStorage.setItem('auth_token', response.token!)

      // Refresh all stores after successful login to get latest data
      const { useStoreRefresh } = await import('@/composables/useStoreRefresh')
      const { refreshAllStores } = useStoreRefresh()
      await refreshAllStores()

      Notify.create({
        type: 'positive',
        message: t('auth.loginSuccess'),
        timeout: 2000
      })

      return true
    } catch (error: any) {
      console.error('Login failed:', error)

      const message = error instanceof ApiError ? error.body?.message : t('auth.loginFailed')
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  // Logout
  async function logout() {
    try {
      await AuthenticationService.postApiAuthLogout()
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Clear local state regardless
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')

      // Reset all other stores to clear user data
      // Import stores dynamically to avoid circular dependencies
      const { useGroupsStore } = await import('./groupsStore')
      const { usePantryStore } = await import('./pantryStore')
      const { useShoppingStore } = await import('./shoppingStore')
      const { useItemsStore } = await import('./itemsStore')
      const { useNavigationStore } = await import('./navigationStore')

      useGroupsStore().$reset()
      usePantryStore().$reset()
      useShoppingStore().$reset()
      useItemsStore().$reset()
      useNavigationStore().$reset()

      Notify.create({
        type: 'info',
        message: t('auth.logoutSuccess'),
        timeout: 2000
      })

      // Create a new anonymous user session
      await createAnonymous()

      // Refresh all stores for the new anonymous user
      const { useStoreRefresh } = await import('@/composables/useStoreRefresh')
      const { refreshAllStores } = useStoreRefresh()
      await refreshAllStores()
    }
  }

  // Fetch current user info
  async function fetchUser() {
    if (!token.value) {
      return
    }

    loading.value = true
    try {
      user.value = await AuthenticationService.getApiAuthMe()
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      
      // If 401, token is invalid - clear auth and create anonymous user
      if (error instanceof ApiError && error.status === 401) {
        token.value = null
        user.value = null
        localStorage.removeItem('auth_token')
        // Create anonymous user as fallback
        await createAnonymous()
      }
    } finally {
      loading.value = false
    }
  }

  // Set a language preference (interface or items) and persist via profile API
  async function setLanguage(kind: 'interface' | 'items', locale: 'en' | 'cs') {
    if (!user.value) return false
    const field = kind === 'interface' ? 'interfaceLanguage' : 'itemsLanguage'
    // Optimistic update so the UI reacts immediately even on slow networks
    user.value = { ...user.value, [field]: locale } as User
    try {
      await AuthenticationService.putApiAuthProfile({ [field]: locale } as any)
      return true
    } catch (error) {
      console.error('Failed to update language preference:', error)
      return false
    }
  }

  // Update profile
  async function updateProfile(data: Partial<User>) {
    if (!isAuthenticated.value) {
      return false
    }

    loading.value = true
    try {
      user.value = await AuthenticationService.putApiAuthProfile(data as any)
      
      Notify.create({
        type: 'positive',
        message: t('profile.profileUpdated'),
        timeout: 2000
      })

      return true
    } catch (error: any) {
      console.error('Profile update failed:', error)

      const message = error instanceof ApiError ? error.body?.message : t('profile.profileUpdateFailed')
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  // Change password
  async function changePassword(oldPassword: string, newPassword: string) {
    if (!isAuthenticated.value) {
      return false
    }

    loading.value = true
    try {
      await AuthenticationService.postApiAuthChangePassword({
        oldPassword,
        newPassword
      })
      
      Notify.create({
        type: 'positive',
        message: t('auth.passwordChanged'),
        timeout: 2000
      })

      return true
    } catch (error: any) {
      console.error('Password change failed:', error)

      const message = error instanceof ApiError ? error.body?.message : t('auth.passwordChangeFailed')
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })
      
      return false
    } finally {
      loading.value = false
    }
  }

  // Create anonymous user
  async function createAnonymous() {
    loading.value = true
    try {
      const response = await AuthenticationService.postApiAuthAnonymous()

      // Store token and user
      token.value = response.token!
      user.value = response.user!
      localStorage.setItem('auth_token', response.token!)

      Notify.create({
        type: 'info',
        message: t('auth.welcomeAnonymous'),
        timeout: 3000
      })

      return true
    } catch (error: any) {
      console.error('Failed to create anonymous user:', error)

      const message = error instanceof ApiError ? error.body?.message : t('auth.anonymousFailed')
      Notify.create({
        type: 'negative',
        message,
        timeout: 3000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  // Initialize - fetch user if token exists, or create anonymous user
  async function initialize() {
    // Prevent multiple simultaneous initializations
    if (initializing.value) {
      // Wait for ongoing initialization to complete
      while (initializing.value) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return
    }

    // Skip if already initialized with valid state
    if (initialized.value && isAuthenticated.value) {
      return
    }

    initializing.value = true
    try {
      if (token.value) {
        await fetchUser()
      }
      
      // If still not authenticated after fetching (token was invalid or didn't exist), create anonymous user
      if (!isAuthenticated.value) {
        await createAnonymous()
      }
      
      initialized.value = true
    } finally {
      initializing.value = false
    }
  }

  return {
    user,
    token,
    loading,
    initialized,
    initializing,
    isAuthenticated,
    isAnonymous,
    userEmail,
    userName,
    hasGlobalPermission,
    register,
    login,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    createAnonymous,
    initialize,
    setLanguage
  }
}, {
  // `initialized` / `initializing` are runtime-only flags — persisting them
  // across reloads makes the router guard skip `initialize()` and trust a
  // stale token.
  persist: {
    pick: ['user', 'token']
  }
})
