<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import PageWrapper from '@/components/PageWrapper.vue'

const authStore = useAuthStore()

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
    <div class="auth-view">
      <div class="container">
      <h2 class="text-h4 text-center q-mb-lg">User Authentication</h2>

      <!-- Not Authenticated or Anonymous - Show Login/Register -->
      <div v-if="!authStore.isAuthenticated || authStore.isAnonymous" class="auth-forms">
        <q-card class="form-card">
          <!-- Toggle Buttons -->
          <q-card-section class="q-pb-none">
            <q-btn-toggle
              v-model="mode"
              spread
              no-caps
              toggle-color="primary"
              :options="[
                { label: 'Login', value: 'login' },
                { label: 'Register', value: 'register' }
              ]"
            />
          </q-card-section>

          <!-- Login Form -->
          <q-card-section v-if="mode === 'login'">
            <div class="text-h5 q-mb-md">Login</div>
            
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input
                v-model="loginEmail"
                type="email"
                label="Email"
                outlined
                :rules="[
                  val => !!val || 'Email is required',
                  val => validateEmail(val) || 'Invalid email address'
                ]"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="loginPassword"
                type="password"
                label="Password"
                outlined
                :rules="[val => !!val || 'Password is required']"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                label="Login"
                :loading="authStore.loading"
                class="full-width"
                size="lg"
              />
            </q-form>
          </q-card-section>

          <!-- Register Form -->
          <q-card-section v-if="mode === 'register'">
            <div class="text-h5 q-mb-md">Create Account</div>
            
            <q-form @submit.prevent="handleRegister" class="q-gutter-md">
              <q-input
                v-model="registerName"
                label="Name (optional)"
                outlined
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                v-model="registerEmail"
                type="email"
                label="Email"
                outlined
                :rules="[
                  val => !!val || 'Email is required',
                  val => validateEmail(val) || 'Invalid email address'
                ]"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="registerPassword"
                type="password"
                label="Password"
                outlined
                :rules="[
                  val => !!val || 'Password is required',
                  val => val.length >= 6 || 'Password must be at least 6 characters'
                ]"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-input
                v-model="registerPasswordConfirm"
                type="password"
                label="Confirm Password"
                outlined
                :rules="[
                  val => !!val || 'Please confirm password',
                  val => val === registerPassword || 'Passwords do not match'
                ]"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                label="Create Account"
                :loading="authStore.loading"
                class="full-width"
                size="lg"
              />
            </q-form>
          </q-card-section>
        </q-card>

        <!-- API Status -->
        <q-card class="api-status-card q-mt-md">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">
              <q-icon name="info" class="q-mr-sm" />
              API Status: Waiting for authentication...
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Authenticated and Not Anonymous - Show User Info -->
      <div v-else-if="authStore.isAuthenticated && !authStore.isAnonymous" class="user-info">
        <q-card class="user-card">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center">
              <q-avatar size="64px" color="white" text-color="primary" class="q-mr-md">
                <q-icon name="person" size="32px" />
              </q-avatar>
              <div>
                <div class="text-h5">{{ authStore.userName }}</div>
                <div class="text-subtitle2">{{ authStore.userEmail }}</div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-h6 q-mb-md">User Information</div>
            
            <q-list bordered separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="badge" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>User ID</q-item-label>
                  <q-item-label caption>{{ authStore.user?._id || 'N/A' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="person" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Name</q-item-label>
                  <q-item-label caption>{{ authStore.user?.name || 'Not set' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="email" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Email</q-item-label>
                  <q-item-label caption>{{ authStore.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="event" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Created</q-item-label>
                  <q-item-label caption>
                    {{ authStore.user?.createdAt ? new Date(authStore.user.createdAt).toLocaleString() : 'N/A' }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="vpn_key" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Token</q-item-label>
                  <q-item-label caption class="text-mono">
                    {{ authStore.token ? authStore.token.substring(0, 20) + '...' : 'N/A' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-h6 q-mb-md">Permissions</div>

            <q-list bordered separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="shield" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Global Permissions</q-item-label>
                  <q-item-label caption>
                    <div v-if="authStore.user?.globalPermissions && authStore.user.globalPermissions.length > 0" class="permissions-list">
                      <q-chip
                        v-for="permission in authStore.user.globalPermissions"
                        :key="permission"
                        size="sm"
                        color="primary"
                        text-color="white"
                        icon="check_circle"
                        class="q-ma-xs"
                      >
                        {{ permission }}
                      </q-chip>
                    </div>
                    <span v-else class="text-grey-6">No global permissions</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="text-caption text-grey-6 q-mt-sm q-px-md">
              Global permissions are system-wide. Group-specific permissions are managed in the Groups section.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions>
            <q-btn
              flat
              color="primary"
              label="Edit Profile"
              icon="edit"
              @click="openProfileDialog"
            />
            <q-btn
              flat
              color="primary"
              label="Change Password"
              icon="lock"
              @click="openPasswordDialog"
            />
            <q-space />
            <q-btn
              flat
              color="negative"
              label="Logout"
              icon="logout"
              @click="handleLogout"
            />
          </q-card-actions>
        </q-card>

        <!-- Token Info -->
        <q-card class="token-card q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Authentication Token</div>
            <div class="token-display">
              <code>{{ authStore.token }}</code>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              This token is stored in localStorage and sent with all API requests
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Edit Profile Dialog -->
      <q-dialog v-model="showProfileDialog">
        <q-card style="width: 100%; max-width: 400px">
          <q-card-section>
            <div class="text-h6">Edit Profile</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-form @submit.prevent="updateProfile" class="q-gutter-md">
              <q-input
                v-model="profileName"
                label="Name"
                outlined
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                v-model="profileEmail"
                type="email"
                label="Email"
                outlined
                :rules="[
                  val => !!val || 'Email is required',
                  val => validateEmail(val) || 'Invalid email address'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
            </q-form>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              label="Save"
              color="primary"
              @click="updateProfile"
              :loading="authStore.loading"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Change Password Dialog -->
      <q-dialog v-model="showPasswordDialog">
        <q-card style="width: 100%; max-width: 400px">
          <q-card-section>
            <div class="text-h6">Change Password</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-form @submit.prevent="changePassword" class="q-gutter-md">
              <q-input
                v-model="oldPassword"
                type="password"
                label="Current Password"
                outlined
                :rules="[val => !!val || 'Current password is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-input
                v-model="newPassword"
                type="password"
                label="New Password"
                outlined
                :rules="[
                  val => !!val || 'New password is required',
                  val => val.length >= 6 || 'Password must be at least 6 characters'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-input
                v-model="newPasswordConfirm"
                type="password"
                label="Confirm New Password"
                outlined
                :rules="[
                  val => !!val || 'Please confirm new password',
                  val => val === newPassword || 'Passwords do not match'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </q-form>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              label="Change Password"
              color="primary"
              @click="changePassword"
              :loading="authStore.loading"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      </div>
    </div>
  </PageWrapper>
</template>

<style scoped>
.auth-view {
  width: 100%;
}

.container {
  width: 100%;
}

.form-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.user-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.token-card {
  background: #f5f5f5;
}

.token-display {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.text-mono {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.api-status-card {
  background: rgba(255, 255, 255, 0.9);
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
</style>
