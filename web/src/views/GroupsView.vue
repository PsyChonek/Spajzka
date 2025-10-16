<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { GroupsService } from '@/api-client'
import type { GroupMember } from '@/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import GroupActions from '@/components/GroupActions.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Notify } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { useGroupsStore } from '@/stores/groupsStore'
import { useRouter } from 'vue-router'

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
  if (!authStore.isAuthenticated) {
    showAuthRequiredDialog.value = true
    return
  }
  await groupsStore.initialize()
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
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to delete group'
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

const memberColumns = [
  {
    name: 'name',
    label: 'Name',
    align: 'left' as const,
    field: (row: GroupMember) => row.name,
    sortable: true
  },
  {
    name: 'email',
    label: 'Email',
    align: 'left' as const,
    field: (row: GroupMember) => row.email,
    sortable: true
  },
  {
    name: 'role',
    label: 'Role',
    align: 'center' as const,
    field: (row: GroupMember) => row.role === 'admin' ? 'Admin' : 'Member',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: ''
  }
]
</script>

<template>
  <PageWrapper>
    <div class="groups-view">
      <div class="q-mb-lg">
        <h4 class="q-my-md">Group Management</h4>
      </div>

      <!-- Loading State -->
      <div v-if="loading && groupsStore.groups.length === 0 && authStore.isAuthenticated" class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md text-grey-7">Loading...</div>
      </div>

      <!-- No Group State -->
      <div v-else-if="groupsStore.groups.length === 0 && authStore.isAuthenticated" class="no-group-container">
        <GroupActions 
          @group-created="handleGroupCreatedOrJoined"
          @group-joined="handleGroupCreatedOrJoined"
        />
      </div>

      <!-- Has Groups State -->
      <div v-else-if="groupsStore.currentGroup && authStore.isAuthenticated">
        <!-- Group Info Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-h5">{{ groupsStore.currentGroup.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
                </div>
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  v-if="isAdmin"
                  flat
                  icon="edit"
                  color="primary"
                  @click="openEditDialog"
                >
                  <q-tooltip>Edit Group</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  icon="link"
                  color="primary"
                  @click="showInvite"
                >
                  <q-tooltip>Invite Code</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  icon="exit_to_app"
                  color="negative"
                  @click="leaveGroup"
                >
                  <q-tooltip>Leave Group</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="isAdmin"
                  flat
                  icon="delete"
                  color="negative"
                  @click="deleteGroup"
                >
                  <q-tooltip>Delete Group</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Members Table -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">Members</div>
            <q-table
              :rows="members"
              :columns="memberColumns"
              row-key="_id"
              flat
              bordered
            >
              <template v-slot:body-cell-role="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.row.role === 'admin' ? 'primary' : 'grey-6'"
                    :label="props.row.role === 'admin' ? 'Admin' : 'Member'"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    v-if="isAdmin && props.row.role !== 'admin'"
                    flat
                    dense
                    round
                    color="negative"
                    icon="person_remove"
                    size="sm"
                    @click="kickMember(props.row._id, props.row.name)"
                  >
                    <q-tooltip>Remove from group</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <!-- Group Actions Panel -->
        <GroupActions 
          @group-created="handleGroupCreatedOrJoined"
          @group-joined="handleGroupCreatedOrJoined"
        />
      </div>

      <!-- Edit Group Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Edit Group</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="editGroupName"
              outlined
              label="Group Name"
              autofocus
              @keyup.enter="updateGroup"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
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
      <q-dialog v-model="showInviteDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Invite Code</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-sm">Share this code with others to invite them:</div>
              <div class="invite-code-display">
                <div class="text-h4 text-primary text-weight-bold">
                  {{ groupsStore.currentGroup?.inviteCode }}
                </div>
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
            </div>

            <div v-if="isAdmin" class="q-mt-lg">
              <q-separator class="q-mb-md" />
              <div class="text-subtitle2 q-mb-sm">Admin Actions</div>

              <div class="row q-gutter-sm q-mb-sm">
                <q-btn
                  outline
                  color="primary"
                  label="Regenerate Code"
                  icon="refresh"
                  @click="regenerateInviteCode"
                  :loading="loading"
                />
                <q-btn
                  :outline="!groupsStore.currentGroup?.inviteEnabled"
                  :color="groupsStore.currentGroup?.inviteEnabled ? 'positive' : 'negative'"
                  :label="groupsStore.currentGroup?.inviteEnabled ? 'Invites Enabled' : 'Invites Disabled'"
                  :icon="groupsStore.currentGroup?.inviteEnabled ? 'check_circle' : 'block'"
                  @click="toggleInvite"
                  :loading="loading"
                />
              </div>
              <div class="text-caption text-grey-7">
                {{ groupsStore.currentGroup?.inviteEnabled
                  ? 'Users can join with the invite code'
                  : 'Invites are currently disabled' }}
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Authentication Required Dialog -->
      <q-dialog v-model="showAuthRequiredDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="text-center q-pt-lg">
            <q-icon name="lock" size="60px" color="orange" class="q-mb-md" />
            <div class="text-h6">Authentication Required</div>
          </q-card-section>

          <q-card-section class="q-pt-none text-center">
            <p class="text-body1 q-mb-md">
              Groups feature requires you to be logged in to sync data across devices and share with other users.
            </p>
            <p class="text-body2 text-grey-7">
              Please log in or create an account to use this feature.
            </p>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-lg">
            <q-btn
              label="Go to Login"
              color="primary"
              icon="login"
              size="lg"
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
    </div>
  </PageWrapper>
</template>

<style scoped>
.groups-view {
  max-width: 1200px;
  margin: 0 auto;
}

.no-group-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.no-group-card {
  max-width: 600px;
  width: 100%;
}

.invite-code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(var(--q-primary-rgb), 0.1);
  border-radius: 8px;
}
</style>
