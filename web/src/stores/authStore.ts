import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  AuthenticationService, 
  type User, 
  type RegisterRequest, 
  type LoginRequest,
  ApiError 
} from '@/services/auth'
import { Notify } from 'quasar'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.name || user.value?.email || 'User')

  // Register new user
  async function register(data: RegisterRequest) {
    loading.value = true
    try {
      const response = await AuthenticationService.postApiAuthRegister(data)
      
      // Store token and user
      token.value = response.token!
      user.value = response.user!
      localStorage.setItem('auth_token', response.token!)
      
      Notify.create({
        type: 'positive',
        message: 'Account created successfully!',
        timeout: 2000
      })
      
      return true
    } catch (error: any) {
      console.error('Registration failed:', error)
      
      const message = error instanceof ApiError ? error.body?.message : 'Registration failed'
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
      
      Notify.create({
        type: 'positive',
        message: 'Logged in successfully!',
        timeout: 2000
      })
      
      return true
    } catch (error: any) {
      console.error('Login failed:', error)
      
      const message = error instanceof ApiError ? error.body?.message : 'Login failed'
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
      
      Notify.create({
        type: 'info',
        message: 'Logged out successfully',
        timeout: 2000
      })
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
      
      // If 401, token is invalid - clear auth
      if (error instanceof ApiError && error.status === 401) {
        token.value = null
        user.value = null
        localStorage.removeItem('auth_token')
      }
    } finally {
      loading.value = false
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
        message: 'Profile updated successfully!',
        timeout: 2000
      })
      
      return true
    } catch (error: any) {
      console.error('Profile update failed:', error)
      
      const message = error instanceof ApiError ? error.body?.message : 'Update failed'
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
        message: 'Password changed successfully!',
        timeout: 2000
      })
      
      return true
    } catch (error: any) {
      console.error('Password change failed:', error)
      
      const message = error instanceof ApiError ? error.body?.message : 'Password change failed'
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

  // Initialize - fetch user if token exists
  async function initialize() {
    if (token.value) {
      await fetchUser()
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    userEmail,
    userName,
    register,
    login,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    initialize
  }
}, {
  persist: true
})
