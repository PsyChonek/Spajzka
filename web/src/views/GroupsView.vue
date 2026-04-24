<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { GroupsService } from '@shared/api-client'
import type { GroupMember } from '@shared/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import GroupActions from '@/components/GroupActions.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Notify, useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { useGroupsStore } from '@/stores/groupsStore'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const router = useRouter()

const members = ref<GroupMember[]>([])
const loading = ref(false)

// Dialog states
const showEditDialog = ref(false)
const showInviteDialog = ref(false)
const showAuthRequiredDialog = ref(false)
const showLeaveDialog = ref(false)
const showDeleteDialog = ref(false)
const showKickDialog = ref(false)
const showRegenerateDialog = ref(false)

// Kick member data
const memberToKick = ref<{ userId: string, userName: string } | null>(null)

// Form fields
const editGroupName = ref('')

onMounted(async () => {
  // Show auth dialog for anonymous users
  if (authStore.isAnonymous) {
    showAuthRequiredDialog.value = true
    return
  }
  // Router guard handles store initialization
  // Just fetch members for the current group
  if (groupsStore.currentGroup) {
    await fetchMembers()
  }
})

const goToLogin = () => {
  showAuthRequiredDialog.value = false
  router.push('/profile')
}

const fetchMembers = async () => {
  if (!groupsStore.currentGroup?._id) return

  try {
    members.value = await GroupsService.getApiGroupsMembers(groupsStore.currentGroup._id)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to fetch members'
    })
  }
}

// Watch for group changes from navbar
watch(() => groupsStore.currentGroupId, async () => {
  if (groupsStore.currentGroup) {
    await fetchMembers()
  }
})

const isAdmin = computed(() => {
  if (!groupsStore.currentGroup) return false
  const userId = authStore.user?._id
  if (!userId) return false
  const currentMember = members.value.find(m => m._id === userId)
  return currentMember?.role === 'admin'
})

const handleGroupCreatedOrJoined = async () => {
  if (groupsStore.currentGroup) {
    await fetchMembers()
  }
}

const openEditDialog = () => {
  editGroupName.value = groupsStore.currentGroup?.name || ''
  showEditDialog.value = true
}

const updateGroup = async () => {
  if (!editGroupName.value.trim() || !groupsStore.currentGroup?._id) return

  loading.value = true
  try {
    await GroupsService.putApiGroups(groupsStore.currentGroup._id, {
      name: editGroupName.value.trim()
    })
    await groupsStore.fetchGroups()
    showEditDialog.value = false
    Notify.create({
      type: 'positive',
      message: 'Group updated successfully'
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to update group'
    })
  } finally {
    loading.value = false
  }
}

const leaveGroup = () => {
  if (!groupsStore.currentGroup?._id) return
  showLeaveDialog.value = true
}

const confirmLeaveGroup = async () => {
  if (!groupsStore.currentGroup?._id) return

  loading.value = true
  try {
    await GroupsService.postApiGroupsLeave(groupsStore.currentGroup._id)
    await groupsStore.fetchGroups()
    members.value = []
    if (groupsStore.currentGroup) {
      await fetchMembers()
    }
    Notify.create({
      type: 'positive',
      message: 'Successfully left group'
    })
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.body?.message || 'Failed to leave group'
    })
  } finally {
    loading.value = false
  }
}

const leaveDialogMessage = computed(() => {
  return isAdmin.value && members.value.length > 1
    ? 'As admin, you cannot leave while there are other members. Remove all members first or delete the group.'
    : 'Are you sure you want to leave this group?'
})

const deleteGroup = () => {
  if (!groupsStore.currentGroup?._id) return
  showDeleteDialog.value = true
}

const confirmDeleteGroup = async () => {
  if (!groupsStore.currentGroup?._id) return

  loading.value = true
  try {
    await GroupsService.deleteApiGroups(groupsStore.currentGroup._id)
    await groupsStore.fetchGroups()
    members.value = []
    if (groupsStore.currentGroup) {
      await fetchMembers()
    }
    Notify.create({
      type: 'positive',
      message: 'Group deleted successfully'
    })
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.body?.message || 'Failed to delete group'
    })
  } finally {
    loading.value = false
  }
}

const kickMember = (userId: string, userName: string) => {
  if (!groupsStore.currentGroup?._id) return
  memberToKick.value = { userId, userName }
  showKickDialog.value = true
}

const confirmKickMember = async () => {
  if (!groupsStore.currentGroup?._id || !memberToKick.value) return

  loading.value = true
  try {
    await GroupsService.deleteApiGroupsKick(groupsStore.currentGroup._id, memberToKick.value.userId)
    await fetchMembers()
    Notify.create({
      type: 'positive',
      message: `${memberToKick.value.userName} has been removed from the group`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to kick member'
    })
  } finally {
    loading.value = false
    memberToKick.value = null
  }
}

const cancelKickMember = () => {
  memberToKick.value = null
}

const kickDialogMessage = computed(() => {
  if (!memberToKick.value) return ''
  return `Are you sure you want to kick <strong>${memberToKick.value.userName}</strong> from the group?`
})

const regenerateInviteCode = () => {
  if (!groupsStore.currentGroup?._id) return
  showRegenerateDialog.value = true
}

const confirmRegenerateInviteCode = async () => {
  if (!groupsStore.currentGroup?._id) return

  loading.value = true
  try {
    await GroupsService.postApiGroupsRegenerateInvite(groupsStore.currentGroup._id)
    await groupsStore.fetchGroups()
    Notify.create({
      type: 'positive',
      message: 'Invite code regenerated'
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to regenerate invite code'
    })
  } finally {
    loading.value = false
  }
}

const toggleInvite = async () => {
  if (!groupsStore.currentGroup?._id) return

  const newStatus = !groupsStore.currentGroup.inviteEnabled
  loading.value = true
  try {
    await GroupsService.postApiGroupsToggleInvite(groupsStore.currentGroup._id, {
      enabled: newStatus
    })
    await groupsStore.fetchGroups()
    Notify.create({
      type: 'positive',
      message: `Invites ${newStatus ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to toggle invite status'
    })
  } finally {
    loading.value = false
  }
}

const copyInviteCode = () => {
  if (!groupsStore.currentGroup?.inviteCode) return

  navigator.clipboard.writeText(groupsStore.currentGroup.inviteCode)
  Notify.create({
    type: 'positive',
    message: 'Invite code copied to clipboard'
  })
}

const showInvite = () => {
  showInviteDialog.value = true
}

const currentUserRole = computed(() => {
  if (!groupsStore.currentGroup) return null
  const userId = authStore.user?._id
  if (!userId) return null
  const currentMember = members.value.find(m => m._id === userId)
  return currentMember?.role || null
})

const currentUserPermissions = computed(() => {
  // Return group permissions from the user object (already fetched via /auth/me)
  return authStore.user?.groupPermissions || []
})

/** First two initials from a display name */
const initials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
</script>

<template>
  <q-page>
    <PageWrapper>
      <PageHeader
        title="Groups"
        icon="group"
        :subtitle="groupsStore.groups.length
          ? `${groupsStore.groups.length} ${groupsStore.groups.length === 1 ? 'group' : 'groups'}`
          : undefined"
      >
        <template #actions>
          <template v-if="groupsStore.currentGroup && !authStore.isAnonymous">
            <q-btn
              v-if="isAdmin"
              unelevated
              no-caps
              icon="edit"
              label="Rename"
              color="primary"
              class="lt-md"
              size="sm"
              @click="openEditDialog"
            />
            <q-btn
              v-if="!groupsStore.currentGroup.isPersonal"
              unelevated
              no-caps
              icon="link"
              label="Invite"
              color="primary"
              size="sm"
              @click="showInvite"
            />
          </template>
        </template>
      </PageHeader>

      <!-- Loading State -->
      <div v-if="loading && groupsStore.groups.length === 0 && !authStore.isAnonymous" class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md sp-text-muted">Loading...</div>
      </div>

      <!-- No Group State -->
      <div v-else-if="groupsStore.groups.length === 0 && !authStore.isAnonymous">
        <GroupActions
          @group-created="handleGroupCreatedOrJoined"
          @group-joined="handleGroupCreatedOrJoined"
        />
      </div>

      <!-- Has Groups State -->
      <div v-else-if="groupsStore.currentGroup && !authStore.isAnonymous" class="sp-groups-content">

        <!-- Group Info -->
        <SectionCard :title="groupsStore.currentGroup.name">
          <template #actions>
            <q-btn
              v-if="isAdmin"
              unelevated
              no-caps
              dense
              icon="edit"
              color="primary"
              class="gt-sm"
              @click="openEditDialog"
            >
              <q-tooltip>Rename group</q-tooltip>
            </q-btn>
            <q-btn
              v-if="!groupsStore.currentGroup.isPersonal"
              unelevated
              no-caps
              dense
              icon="link"
              color="primary"
              class="gt-sm"
              @click="showInvite"
            >
              <q-tooltip>Invite code</q-tooltip>
            </q-btn>
            <q-btn
              unelevated
              no-caps
              dense
              icon="exit_to_app"
              color="negative"
              @click="leaveGroup"
            >
              <q-tooltip>Leave group</q-tooltip>
            </q-btn>
            <q-btn
              v-if="isAdmin && !groupsStore.currentGroup.isPersonal"
              unelevated
              no-caps
              dense
              icon="delete"
              color="negative"
              @click="deleteGroup"
            >
              <q-tooltip>Delete group</q-tooltip>
            </q-btn>
          </template>

          <div class="sp-group-meta">
            <q-icon name="people" size="16px" color="primary" />
            <span class="sp-text-muted">
              {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
            </span>
          </div>
        </SectionCard>

        <!-- Members -->
        <SectionCard title="Members">
          <q-list separator>
            <q-item
              v-for="member in members"
              :key="member._id"
              class="sp-member-item"
            >
              <q-item-section avatar>
                <q-avatar
                  size="40px"
                  :color="member.role === 'admin' ? 'primary' : 'grey-4'"
                  :text-color="member.role === 'admin' ? 'white' : 'grey-8'"
                  class="sp-member-avatar"
                >
                  {{ initials(member.name || '') }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="sp-member-name">{{ member.name }}</q-item-label>
                <q-item-label caption class="sp-text-muted">{{ member.email }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge
                    :color="member.role === 'admin' ? 'primary' : 'grey-5'"
                    :text-color="member.role === 'admin' ? 'white' : 'grey-9'"
                    :label="member.role === 'admin' ? 'Admin' : 'Member'"
                    class="sp-role-badge"
                  />
                  <q-btn
                    v-if="isAdmin && member.role !== 'admin'"
                    flat
                    dense
                    round
                    icon="person_remove"
                    color="negative"
                    size="sm"
                    @click="kickMember(member._id || '', member.name || '')"
                  >
                    <q-tooltip>Remove from group</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </SectionCard>

        <!-- Your Permissions -->
        <SectionCard title="Your Permissions">
          <div class="sp-permissions-row">
            <q-icon name="shield" size="18px" color="primary" class="q-mr-sm" />
            <span class="sp-text-muted q-mr-sm">Role: <strong class="sp-text">{{ currentUserRole || 'N/A' }}</strong></span>
          </div>
          <div v-if="currentUserPermissions.length > 0" class="sp-chips q-mt-sm">
            <q-chip
              v-for="permission in currentUserPermissions"
              :key="permission"
              size="sm"
              color="primary"
              text-color="white"
              icon="check_circle"
            >
              {{ permission }}
            </q-chip>
          </div>
          <div v-else class="sp-text-muted q-mt-xs">No group permissions assigned.</div>
        </SectionCard>

        <!-- Group Actions Panel (create/join another group) -->
        <GroupActions
          @group-created="handleGroupCreatedOrJoined"
          @group-joined="handleGroupCreatedOrJoined"
        />
      </div>

      <!-- Edit Group Dialog -->
      <q-dialog v-model="showEditDialog" :full-width="$q.screen.lt.sm" :maximized="$q.screen.lt.sm">
        <q-card class="sp-dialog" :style="$q.screen.lt.sm ? '' : 'width: 100%; max-width: 400px'">
          <q-card-section>
            <div class="sp-dialog-title">Edit Group</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="editGroupName"
              outlined
              dense
              label="Group Name"
              autofocus
              @keyup.enter="updateGroup"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancel" color="primary" v-close-popup />
            <q-btn
              unelevated
              no-caps
              label="Save"
              color="primary"
              @click="updateGroup"
              :disable="!editGroupName.trim() || loading"
              :loading="loading"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Invite Code Dialog -->
      <q-dialog v-model="showInviteDialog" :full-width="$q.screen.lt.sm" :maximized="$q.screen.lt.sm">
        <q-card class="sp-dialog" :style="$q.screen.lt.sm ? '' : 'width: 100%; max-width: 420px'">
          <q-card-section>
            <div class="sp-dialog-title">Invite Code</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="sp-text-muted q-mb-sm">Share this code with others to invite them:</div>
            <div class="sp-invite-code-box">
              <span class="sp-invite-code-text">{{ groupsStore.currentGroup?.inviteCode }}</span>
              <q-btn
                flat
                dense
                round
                icon="content_copy"
                color="primary"
                @click="copyInviteCode"
              >
                <q-tooltip>Copy to clipboard</q-tooltip>
              </q-btn>
            </div>

            <template v-if="isAdmin">
              <q-separator class="q-my-md" />
              <div class="sp-dialog-subtitle q-mb-sm">Admin Actions</div>
              <div class="row q-gutter-sm q-mb-sm">
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  label="Regenerate Code"
                  icon="refresh"
                  @click="regenerateInviteCode"
                  :loading="loading"
                />
                <q-btn
                  unelevated
                  no-caps
                  :color="groupsStore.currentGroup?.inviteEnabled ? 'positive' : 'negative'"
                  :label="groupsStore.currentGroup?.inviteEnabled ? 'Invites Enabled' : 'Invites Disabled'"
                  :icon="groupsStore.currentGroup?.inviteEnabled ? 'check_circle' : 'block'"
                  @click="toggleInvite"
                  :loading="loading"
                />
              </div>
              <div class="sp-text-muted text-caption">
                {{ groupsStore.currentGroup?.inviteEnabled
                  ? 'Users can join with the invite code'
                  : 'Invites are currently disabled' }}
              </div>
            </template>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Close" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Authentication Required Dialog -->
      <q-dialog v-model="showAuthRequiredDialog" persistent :full-width="$q.screen.lt.sm" :maximized="$q.screen.lt.sm">
        <q-card class="sp-dialog" :style="$q.screen.lt.sm ? '' : 'width: 100%; max-width: 400px'">
          <q-card-section class="text-center q-pt-lg">
            <q-icon name="lock" size="52px" color="secondary" class="q-mb-md" />
            <div class="sp-dialog-title">Authentication Required</div>
          </q-card-section>

          <q-card-section class="q-pt-none text-center">
            <p class="text-body1 q-mb-sm">
              Groups feature requires you to be logged in to sync data across devices and share with other users.
            </p>
            <p class="sp-text-muted text-body2">
              Please log in or create an account to use this feature.
            </p>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-lg">
            <q-btn
              unelevated
              no-caps
              label="Go to Login"
              color="primary"
              icon="login"
              size="md"
              @click="goToLogin"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Confirmation Dialogs -->
      <ConfirmDialog
        v-model="showLeaveDialog"
        title="Leave Group"
        :message="leaveDialogMessage"
        type="warning"
        confirm-label="Leave"
        @confirm="confirmLeaveGroup"
      />

      <ConfirmDialog
        v-model="showDeleteDialog"
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        type="danger"
        confirm-label="Delete"
        @confirm="confirmDeleteGroup"
      />

      <ConfirmDialog
        v-model="showKickDialog"
        title="Remove Member"
        :message="kickDialogMessage"
        type="danger"
        confirm-label="Remove"
        @confirm="confirmKickMember"
        @cancel="cancelKickMember"
      />

      <ConfirmDialog
        v-model="showRegenerateDialog"
        title="Regenerate Invite Code"
        message="Are you sure you want to regenerate the invite code? The old code will no longer work."
        type="warning"
        confirm-label="Regenerate"
        @confirm="confirmRegenerateInviteCode"
      />
    </PageWrapper>
  </q-page>
</template>

<style scoped>
.sp-groups-content {
  max-width: 720px;
}

.sp-group-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

/* Member list */
.sp-member-item {
  padding: 10px 0;
}

.sp-member-name {
  font-weight: 600;
  color: var(--sp-text);
}

.sp-member-avatar {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.sp-role-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 20px;
}

/* Permissions section */
.sp-permissions-row {
  display: flex;
  align-items: center;
}

.sp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Invite code box */
.sp-invite-code-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--sp-primary-soft);
  border-radius: var(--sp-r-md);
  border: 1px solid var(--sp-border);
}

.sp-invite-code-text {
  font-family: 'Manrope', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--sp-primary);
  letter-spacing: 0.08em;
}

/* Dialog */
.sp-dialog-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--sp-text);
}

.sp-dialog-subtitle {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--sp-text);
}

/* Utility */
.sp-text-muted {
  color: var(--sp-text-muted);
}

.sp-text {
  color: var(--sp-text);
}
</style>
