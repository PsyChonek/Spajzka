<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import McpAccessCard from '@/components/McpAccessCard.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import LanguagePreferencesCard from '@/components/LanguagePreferencesCard.vue'

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

// Form mode
const mode = ref<'login' | 'register'>('login')

// Login form
const loginEmail = ref('')
const loginPassword = ref('')

// Register form
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerPasswordConfirm = ref('')

// Profile update
const showProfileDialog = ref(false)
const profileName = ref('')
const profileEmail = ref('')

// Password change
const showPasswordDialog = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')

// Form validation
const loginEmailValid = ref(true)
const registerEmailValid = ref(true)

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const handleLogin = async () => {
  loginEmailValid.value = validateEmail(loginEmail.value)

  if (!loginEmailValid.value) {
    return
  }

  const success = await authStore.login({
    email: loginEmail.value,
    password: loginPassword.value
  })

  if (success) {
    loginEmail.value = ''
    loginPassword.value = ''
  }
}

const handleRegister = async () => {
  registerEmailValid.value = validateEmail(registerEmail.value)

  if (!registerEmailValid.value) {
    return
  }

  if (registerPassword.value !== registerPasswordConfirm.value) {
    return
  }

  const success = await authStore.register({
    name: registerName.value,
    email: registerEmail.value,
    password: registerPassword.value
  })

  if (success) {
    registerName.value = ''
    registerEmail.value = ''
    registerPassword.value = ''
    registerPasswordConfirm.value = ''
    mode.value = 'login'
  }
}

const handleLogout = async () => {
  await authStore.logout()
}

const openProfileDialog = () => {
  profileName.value = authStore.user?.name || ''
  profileEmail.value = authStore.user?.email || ''
  showProfileDialog.value = true
}

const updateProfile = async () => {
  const success = await authStore.updateProfile({
    name: profileName.value,
    email: profileEmail.value
  })

  if (success) {
    showProfileDialog.value = false
  }
}

const openPasswordDialog = () => {
  oldPassword.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
  showPasswordDialog.value = true
}

const changePassword = async () => {
  if (newPassword.value !== newPasswordConfirm.value) {
    return
  }

  const success = await authStore.changePassword(oldPassword.value, newPassword.value)

  if (success) {
    showPasswordDialog.value = false
  }
}

// Note: No need to initialize on mount - router guard and App.vue handle this
</script>

<template>
  <PageWrapper max-width="600px" centered>

    <!-- ── Anonymous / unauthenticated ── -->
    <template v-if="!authStore.isAuthenticated || authStore.isAnonymous">
      <PageHeader
        title="Welcome"
        icon="spa"
        subtitle="Sign in to sync your pantry and share with your household."
      />

      <SectionCard>
        <q-btn-toggle
          v-model="mode"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="white"
          text-color="grey-7"
          :options="[
            { label: 'Login', value: 'login' },
            { label: 'Register', value: 'register' }
          ]"
          class="sp-auth-toggle q-mb-md"
        />

        <!-- Login Form -->
        <q-form v-if="mode === 'login'" @submit.prevent="handleLogin" class="q-gutter-sm">
          <q-input
            v-model="loginEmail"
            type="email"
            label="Email"
            outlined
            dense
            :rules="[
              val => !!val || 'Email is required',
              val => validateEmail(val) || 'Invalid email address'
            ]"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="loginPassword"
            type="password"
            label="Password"
            outlined
            dense
            :rules="[val => !!val || 'Password is required']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            label="Login"
            :loading="authStore.loading"
            class="full-width q-mt-sm"
          />
        </q-form>

        <!-- Register Form -->
        <q-form v-else @submit.prevent="handleRegister" class="q-gutter-sm">
          <q-input
            v-model="registerName"
            label="Name (optional)"
            outlined
            dense
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="registerEmail"
            type="email"
            label="Email"
            outlined
            dense
            :rules="[
              val => !!val || 'Email is required',
              val => validateEmail(val) || 'Invalid email address'
            ]"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="registerPassword"
            type="password"
            label="Password"
            outlined
            dense
            :rules="[
              val => !!val || 'Password is required',
              val => val.length >= 6 || 'Password must be at least 6 characters'
            ]"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="registerPasswordConfirm"
            type="password"
            label="Confirm Password"
            outlined
            dense
            :rules="[
              val => !!val || 'Please confirm password',
              val => val === registerPassword || 'Passwords do not match'
            ]"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            label="Register"
            :loading="authStore.loading"
            class="full-width q-mt-sm"
          />
        </q-form>
      </SectionCard>

      <LanguagePreferencesCard />
    </template>

    <!-- ── Authenticated ── -->
    <template v-else-if="authStore.isAuthenticated && !authStore.isAnonymous">
      <PageHeader
        :title="t('profile.title')"
        icon="account_circle"
      />

      <!-- Account section -->
      <SectionCard :title="t('profile.account')">
        <q-list separator>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="44px" color="primary" text-color="white">
                <q-icon name="person" size="24px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="sp-profile-name">{{ authStore.user?.name || t('profile.noNameSet') }}</q-item-label>
              <q-item-label caption class="sp-text-muted">{{ authStore.user?.email }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="row q-gutter-sm q-mt-md">
          <q-btn
            unelevated
            no-caps
            outline
            color="primary"
            :label="t('profile.editProfile')"
            icon="edit"
            @click="openProfileDialog"
          />
          <q-btn
            unelevated
            no-caps
            outline
            color="primary"
            :label="t('auth.changePassword')"
            icon="lock"
            @click="openPasswordDialog"
          />
        </div>
      </SectionCard>

      <LanguagePreferencesCard />

      <!-- MCP Access -->
      <SectionCard :title="t('profile.mcpAccess')">
        <McpAccessCard />
      </SectionCard>

      <!-- Sign out -->
      <div class="sp-signout-row">
        <q-btn
          unelevated
          no-caps
          color="negative"
          :label="t('auth.logout')"
          icon="logout"
          @click="handleLogout"
        />
      </div>
    </template>

    <!-- Edit Profile Dialog -->
    <BaseDialog
      v-model="showProfileDialog"
      :title="t('profile.editProfileTitle')"
      size="sm"
    >
      <q-form @submit.prevent="updateProfile" class="q-gutter-sm">
        <q-input
          v-model="profileName"
          :label="t('common.name')"
          outlined
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="profileEmail"
          type="email"
          :label="t('auth.email')"
          outlined
          :rules="[
            val => !!val || t('auth.emailRequired'),
            val => validateEmail(val) || t('auth.emailInvalid')
          ]"
        >
          <template #prepend>
            <q-icon name="email" />
          </template>
        </q-input>
      </q-form>

      <template #footer="{ close }">
        <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="close" />
        <q-btn
          unelevated
          no-caps
          :label="t('common.save')"
          color="primary"
          :loading="authStore.loading"
          @click="updateProfile"
        />
      </template>
    </BaseDialog>

    <!-- Change Password Dialog -->
    <BaseDialog
      v-model="showPasswordDialog"
      :title="t('auth.changePassword')"
      header-icon="lock"
      size="sm"
    >
      <q-form @submit.prevent="changePassword" class="q-gutter-sm">
        <q-input
          v-model="oldPassword"
          type="password"
          :label="t('auth.currentPassword')"
          outlined
          :rules="[val => !!val || t('auth.currentPasswordRequired')]"
        />

        <q-input
          v-model="newPassword"
          type="password"
          :label="t('auth.newPassword')"
          outlined
          :rules="[
            val => !!val || t('auth.newPasswordRequired'),
            val => val.length >= 6 || t('auth.passwordTooShort')
          ]"
        />

        <q-input
          v-model="newPasswordConfirm"
          type="password"
          :label="t('auth.confirmNewPassword')"
          outlined
          :rules="[
            val => !!val || t('auth.confirmPasswordRequired'),
            val => val === newPassword || t('auth.passwordsDoNotMatch')
          ]"
        />
      </q-form>

      <template #footer="{ close }">
        <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="close" />
        <q-btn
          unelevated
          no-caps
          :label="t('auth.changePassword')"
          color="primary"
          :loading="authStore.loading"
          @click="changePassword"
        />
      </template>
    </BaseDialog>

  </PageWrapper>
</template>

<style scoped>
.sp-auth-toggle {
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-r-md);
  overflow: hidden;
}

.sp-profile-name {
  font-weight: 600;
  color: var(--sp-text);
}

.sp-signout-row {
  display: flex;
  justify-content: flex-start;
  padding: 4px 0 24px;
}

.sp-text-muted {
  color: var(--sp-text-muted);
}

/* Unwrap McpAccessCard's internal padding when nested in SectionCard */
:deep(.mcp-access-card) {
  box-shadow: none;
  border: none;
  padding: 0;
  margin: 0;
}
</style>
