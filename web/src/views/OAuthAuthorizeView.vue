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
  <q-page class="sp-oauth-page">
    <div class="sp-oauth-wrap">
      <q-card class="sp-oauth-card">

        <!-- Branding -->
        <div class="sp-oauth-brand">
          <div class="sp-oauth-brand-icon">
            <q-icon name="eco" size="28px" color="primary" />
          </div>
          <span class="sp-oauth-brand-name">Spajzka</span>
        </div>

        <!-- Parameter error -->
        <div v-if="paramError" class="sp-oauth-section">
          <q-banner class="sp-oauth-error rounded-borders" dense>
            <template #avatar>
              <q-icon name="error_outline" color="negative" />
            </template>
            {{ paramError }}
          </q-banner>
        </div>

        <!-- Not logged in: show login form -->
        <template v-else-if="!authStore.isAuthenticated || authStore.isAnonymous">
          <div class="sp-oauth-section">
            <div class="sp-oauth-heading">Sign in to continue</div>
            <div class="sp-oauth-subheading">
              Authorise <strong>{{ clientName ?? 'an application' }}</strong> to access your account
            </div>

            <div class="q-gutter-sm">
              <q-input
                v-model="loginEmail"
                label="Email"
                type="email"
                outlined
                dense
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
            </div>

            <q-banner v-if="loginError" class="sp-oauth-error rounded-borders q-mt-sm" dense>
              {{ loginError }}
            </q-banner>

            <q-btn
              unelevated
              no-caps
              label="Sign in"
              color="primary"
              class="full-width q-mt-md"
              :loading="loggingIn"
              @click="handleLogin"
            />
          </div>
        </template>

        <!-- Logged in: show consent -->
        <template v-else>
          <div class="sp-oauth-section">
            <div class="sp-oauth-heading">Authorize access</div>
            <div class="sp-oauth-subheading">
              <strong>{{ clientName ?? 'An application' }}</strong> wants to access your Spajzka account
            </div>
            <div class="sp-oauth-user-pill">
              <q-icon name="account_circle" size="16px" />
              <span>{{ authStore.userEmail }}</span>
            </div>

            <q-list bordered separator class="sp-oauth-scopes rounded-borders q-mb-md">
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

            <q-banner v-if="error" class="sp-oauth-error rounded-borders q-mb-sm" dense>
              {{ error }}
            </q-banner>

            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                no-caps
                outline
                label="Deny"
                color="grey-7"
                class="col"
                :disable="loading"
                @click="handleDeny"
              />
              <q-btn
                unelevated
                no-caps
                label="Allow access"
                color="primary"
                class="col"
                :loading="loading"
                @click="handleAllow"
              />
            </div>
          </div>
        </template>

      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
/* Full-screen centred layout, safe-area aware */
.sp-oauth-page {
  min-height: 100vh;
  background: var(--sp-bg);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: max(48px, env(safe-area-inset-top)) 16px 32px;
}

.sp-oauth-wrap {
  width: 100%;
  max-width: 480px;
}

.sp-oauth-card {
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-lg);
  box-shadow: var(--sp-shadow-2);
  overflow: hidden;
}

/* Branding strip */
.sp-oauth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--sp-border);
}

.sp-oauth-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--sp-primary-soft);
}

.sp-oauth-brand-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--sp-text);
  letter-spacing: -0.02em;
}

/* Content section */
.sp-oauth-section {
  padding: 24px;
}

.sp-oauth-heading {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--sp-text);
  margin-bottom: 6px;
}

.sp-oauth-subheading {
  font-size: 0.9rem;
  color: var(--sp-text-muted);
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Signed-in user pill */
.sp-oauth-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Scope list */
.sp-oauth-scopes {
  border-radius: var(--sp-r-md) !important;
  border-color: var(--sp-border) !important;
}

/* Error banner */
.sp-oauth-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
</style>
