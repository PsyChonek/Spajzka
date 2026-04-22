<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import { useMcpTokenStore } from '@/stores/mcpTokenStore'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const mcpStore = useMcpTokenStore()
const authStore = useAuthStore()

const mcpPublicUrl = computed(() => {
  const configured = import.meta.env.VITE_MCP_PUBLIC_URL as string | undefined
  if (configured) return configured
  // Best-effort fallback when env var is not set (dev setups).
  return `${window.location.protocol}//${window.location.hostname}:3001/mcp`
})

const formatDate = (value?: string | null) => {
  if (!value) return 'never'
  return new Date(value).toLocaleString()
}

const copy = async (value: string, label: string) => {
  try {
    await copyToClipboard(value)
    $q.notify({ type: 'positive', message: `${label} copied.`, timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'Copy failed.', timeout: 2000 })
  }
}

const confirmAndGenerate = () => {
  const isRotation = mcpStore.status?.exists
  if (!isRotation) {
    mcpStore.generate()
    return
  }
  $q.dialog({
    title: 'Regenerate MCP token?',
    message: 'This will immediately revoke the current token. Any MCP client using it will stop working until you paste the new one.',
    cancel: true,
    persistent: true
  }).onOk(() => mcpStore.generate())
}

const confirmAndRevoke = () => {
  $q.dialog({
    title: 'Revoke MCP token?',
    message: 'Any MCP client using this token will stop working.',
    cancel: true,
    persistent: true
  }).onOk(() => mcpStore.revoke())
}

onMounted(() => {
  if (authStore.isAuthenticated && !authStore.isAnonymous) {
    mcpStore.refresh()
  }
})
</script>

<template>
  <q-card class="mcp-card q-mt-md">
    <q-card-section>
      <div class="text-h6 q-mb-sm">
        <q-icon name="smart_toy" class="q-mr-sm" />
        MCP access
      </div>
      <div class="text-caption text-grey-7 q-mb-md">
        Connect your AI assistant (Claude Desktop, Claude Code, Claude.ai) to your Spajzka account
        using an MCP personal access token.
      </div>

      <!-- Disabled for anonymous users -->
      <div v-if="authStore.isAnonymous" class="text-grey-6">
        Log in or create an account to enable MCP access.
      </div>

      <template v-else>
        <!-- Plaintext just generated -->
        <div v-if="mcpStore.latestPlaintext" class="q-mb-md">
          <q-banner class="bg-amber-1 text-dark">
            <template v-slot:avatar>
              <q-icon name="warning" color="warning" />
            </template>
            Save this token now — it will not be shown again.
          </q-banner>
          <div class="token-reveal q-mt-sm">
            <code>{{ mcpStore.latestPlaintext }}</code>
          </div>
          <div class="row q-gutter-sm q-mt-sm">
            <q-btn
              flat
              dense
              color="primary"
              icon="content_copy"
              label="Copy token"
              @click="copy(mcpStore.latestPlaintext!, 'Token')"
            />
            <q-btn
              flat
              dense
              color="grey-7"
              label="I've saved it"
              @click="mcpStore.dismissPlaintext"
            />
          </div>
        </div>

        <!-- Status: exists -->
        <q-list v-if="mcpStore.status?.exists" bordered separator>
          <q-item>
            <q-item-section avatar>
              <q-icon name="event" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Created</q-item-label>
              <q-item-label caption>{{ formatDate(mcpStore.status.createdAt) }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="schedule" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Last used</q-item-label>
              <q-item-label caption>{{ formatDate(mcpStore.status.lastUsedAt) }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="link" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Connection URL</q-item-label>
              <q-item-label caption class="text-mono">{{ mcpPublicUrl }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                dense
                round
                icon="content_copy"
                @click="copy(mcpPublicUrl, 'URL')"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Status: not generated -->
        <div v-else-if="mcpStore.status && !mcpStore.status.exists" class="text-grey-7 q-mb-md">
          No MCP token. Generate one to connect your AI assistant.
        </div>
      </template>
    </q-card-section>

    <q-card-actions v-if="!authStore.isAnonymous" align="right">
      <q-btn
        v-if="mcpStore.status?.exists"
        flat
        color="negative"
        label="Revoke"
        icon="link_off"
        :loading="mcpStore.loading"
        @click="confirmAndRevoke"
      />
      <q-btn
        flat
        color="primary"
        :label="mcpStore.status?.exists ? 'Regenerate' : 'Generate token'"
        icon="key"
        :loading="mcpStore.loading"
        @click="confirmAndGenerate"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.mcp-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.token-reveal {
  background: #1a1a1a;
  color: #c3e88d;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}
.text-mono {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}
</style>
