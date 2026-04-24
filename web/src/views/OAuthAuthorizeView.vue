<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// OAuth parameters from query string
const clientId = computed(() => route.query.client_id as string | undefined)
const redirectUri = computed(() => route.query.redirect_uri as string | undefined)
const codeChallenge = computed(() => route.query.code_challenge as string | undefined)
const codeChallengeMethod = computed(() => route.query.code_challenge_method as string | undefined)
const state = computed(() => route.query.state as string | undefined)
const scope = computed(() => (route.query.scope as string | undefined) ?? 'mcp:tools')

// UI state
const clientName = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const paramError = ref<string | null>(null)

// Login form (shown when user is not authenticated)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref<string | null>(null)
const loggingIn = ref(false)

onMounted(async () => {
  // Validate required parameters first
  if (!clientId.value || !redirectUri.value || !codeChallenge.value || !codeChallengeMethod.value) {
    paramError.value = 'Invalid authorization request: missing required OAuth parameters.'
    return
  }

  // Load client info
  try {
    const res = await fetch(`${API_BASE}/api/oauth/client?client_id=${encodeURIComponent(clientId.value)}`)
    if (!res.ok) {
      paramError.value = 'Unknown OAuth client. The application requesting access is not registered.'
      return
    }
    const data = await res.json()
    clientName.value = data.clientName
  } catch {
    paramError.value = 'Could not verify OAuth client. Please try again.'
  }

  // Initialize auth if needed
  if (!authStore.initialized) {
    await authStore.initialize()
  }
})

async function handleLogin() {
  loginError.value = null
  loggingIn.value = true
  try {
    await authStore.login({ email: loginEmail.value, password: loginPassword.value })
  } catch {
    loginError.value = 'Invalid email or password.'
  } finally {
    loggingIn.value = false
  }
}

async function handleAllow() {
  if (!clientId.value || !redirectUri.value || !codeChallenge.value || !codeChallengeMethod.value) return
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`${API_BASE}/api/oauth/authorize/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        clientId: clientId.value,
        redirectUri: redirectUri.value,
        codeChallenge: codeChallenge.value,
        codeChallengeMethod: codeChallengeMethod.value,
        state: state.value,
        scope: scope.value
      })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      error.value = body.error_description ?? 'Authorization failed. Please try again.'
      return
    }

    const { redirectUrl } = await res.json()
    window.location.href = redirectUrl
  } catch {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleDeny() {
  if (!redirectUri.value) return
  const url = new URL(redirectUri.value)
  url.searchParams.set('error', 'access_denied')
  url.searchParams.set('error_description', 'The user denied access.')
  if (state.value) url.searchParams.set('state', state.value)
  window.location.href = url.toString()
}
</script>

<template>
  <q-page class="flex flex-center bg-grey-1" style="min-height: 100vh;">
    <q-card style="width: 420px; max-width: 95vw;" class="q-pa-md">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="lock" size="40px" color="primary" />
        <div class="text-h6 q-mt-sm">Spajzka</div>
      </q-card-section>

      <!-- Parameter error -->
      <q-card-section v-if="paramError">
        <q-banner class="bg-negative text-white rounded-borders">
          <template #avatar>
            <q-icon name="error" />
          </template>
          {{ paramError }}
        </q-banner>
      </q-card-section>

      <!-- Not logged in: show login form -->
      <template v-else-if="!authStore.isAuthenticated || authStore.isAnonymous">
        <q-card-section>
          <div class="text-subtitle1 text-center q-mb-md">
            Sign in to authorize
            <strong>{{ clientName ?? 'an application' }}</strong>
          </div>

          <q-input
            v-model="loginEmail"
            label="Email"
            type="email"
            outlined
            dense
            class="q-mb-sm"
            @keyup.enter="handleLogin"
          />
          <q-input
            v-model="loginPassword"
            label="Password"
            type="password"
            outlined
            dense
            @keyup.enter="handleLogin"
          />

          <q-banner v-if="loginError" class="bg-negative text-white rounded-borders q-mt-sm" dense>
            {{ loginError }}
          </q-banner>

          <q-btn
            label="Sign in"
            color="primary"
            class="full-width q-mt-md"
            :loading="loggingIn"
            @click="handleLogin"
          />
        </q-card-section>
      </template>

      <!-- Logged in: show consent -->
      <template v-else>
        <q-card-section>
          <div class="text-subtitle1 text-center q-mb-xs">
            <strong>{{ clientName ?? 'An application' }}</strong>
            wants to access your Spajzka account
          </div>
          <div class="text-caption text-grey text-center q-mb-md">
            Signed in as {{ authStore.userEmail }}
          </div>

          <q-list bordered separator class="rounded-borders q-mb-md">
            <q-item>
              <q-item-section avatar>
                <q-icon name="kitchen" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pantry &amp; shopping list</q-item-label>
                <q-item-label caption>Read and write your pantry and shopping list</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="menu_book" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Recipes &amp; meal plan</q-item-label>
                <q-item-label caption>Read and manage your recipes and meal plan</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-banner v-if="error" class="bg-negative text-white rounded-borders q-mb-sm" dense>
            {{ error }}
          </q-banner>

          <div class="row q-gutter-sm">
            <q-btn
              label="Deny"
              flat
              color="grey"
              class="col"
              :disable="loading"
              @click="handleDeny"
            />
            <q-btn
              label="Allow access"
              color="primary"
              class="col"
              :loading="loading"
              @click="handleAllow"
            />
          </div>
        </q-card-section>
      </template>
    </q-card>
  </q-page>
</template>
