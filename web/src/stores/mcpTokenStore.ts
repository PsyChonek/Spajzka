import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AuthenticationService, ApiError, type McpTokenStatus } from '@shared/api-client'
import { Notify } from 'quasar'

export const useMcpTokenStore = defineStore('mcpToken', () => {
  const status = ref<McpTokenStatus | null>(null)
  const loading = ref(false)

  // Plaintext token held in memory only after generation. Cleared when the
  // user dismisses the one-time reveal — never persisted.
  const latestPlaintext = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    try {
      status.value = await AuthenticationService.getApiAuthMcpToken()
    } catch (error) {
      console.error('Failed to fetch MCP token status:', error)
      status.value = null
    } finally {
      loading.value = false
    }
  }

  async function generate(): Promise<boolean> {
    loading.value = true
    try {
      const response = await AuthenticationService.postApiAuthMcpToken()
      latestPlaintext.value = response.token!
      status.value = { exists: true, createdAt: response.createdAt, lastUsedAt: null }
      Notify.create({
        type: 'positive',
        message: 'MCP token generated. Copy it now — it will not be shown again.',
        timeout: 4000
      })
      return true
    } catch (error: unknown) {
      const message = error instanceof ApiError
        ? error.body?.message ?? 'Failed to generate MCP token'
        : 'Failed to generate MCP token'
      Notify.create({ type: 'negative', message, timeout: 3000 })
      return false
    } finally {
      loading.value = false
    }
  }

  async function revoke(): Promise<boolean> {
    loading.value = true
    try {
      await AuthenticationService.deleteApiAuthMcpToken()
      status.value = { exists: false, createdAt: null, lastUsedAt: null }
      latestPlaintext.value = null
      Notify.create({ type: 'info', message: 'MCP token revoked.', timeout: 2000 })
      return true
    } catch (error: unknown) {
      const message = error instanceof ApiError
        ? error.body?.message ?? 'Failed to revoke MCP token'
        : 'Failed to revoke MCP token'
      Notify.create({ type: 'negative', message, timeout: 3000 })
      return false
    } finally {
      loading.value = false
    }
  }

  function dismissPlaintext() {
    latestPlaintext.value = null
  }

  return {
    status,
    loading,
    latestPlaintext,
    refresh,
    generate,
    revoke,
    dismissPlaintext
  }
})
