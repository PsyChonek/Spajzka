<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GroupsService } from '@/api-client'
import type { Group, GroupMember } from '@/api-client'
import PageWrapper from '@/components/PageWrapper.vue'
import { Notify } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const group = ref<Group | null>(null)
const members = ref<GroupMember[]>([])
const loading = ref(false)
const hasGroup = ref(false)

// Dialog states
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)
const showEditDialog = ref(false)
const showInviteDialog = ref(false)
const showAuthRequiredDialog = ref(false)

// Form fields
const newGroupName = ref('')
const joinInviteCode = ref('')
const editGroupName = ref('')

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    showAuthRequiredDialog.value = true
    return
  }
  await fetchGroup()
})

const goToLogin = () => {
  showAuthRequiredDialog.value = false
  router.push('/profile')
}

const fetchGroup = async () => {
  loading.value = true
  try {
    group.value = await GroupsService.getApiGroupsMy()
    hasGroup.value = true
    await fetchMembers()
  } catch (error: any) {
    if (error.status === 404) {
      hasGroup.value = false
    } else {
      Notify.create({
        type: 'negative',
        message: 'Failed to fetch group'
      })
    }
  } finally {
    loading.value = false
  }
}

const fetchMembers = async () => {
  if (!group.value?._id) return

  try {
    members.value = await GroupsService.getApiGroupsMembers(group.value._id)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to fetch members'
    })
  }
}

const isAdmin = computed(() => {
  if (!group.value) return false
  const currentMember = members.value.find(m => m.isAdmin)
  return !!currentMember?.isAdmin
})

const createGroup = async () => {
  if (!newGroupName.value.trim()) return

  loading.value = true
  try {
    group.value = await GroupsService.postApiGroups({
      name: newGroupName.value.trim()
    })
    hasGroup.value = true
    showCreateDialog.value = false
    newGroupName.value = ''
    await fetchMembers()
    Notify.create({
      type: 'positive',
      message: 'Group created successfully'
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to create group'
    })
  } finally {
    loading.value = false
  }
}

const joinGroup = async () => {
  if (!joinInviteCode.value.trim()) return

  loading.value = true
  try {
    group.value = await GroupsService.postApiGroupsJoin({
      inviteCode: joinInviteCode.value.trim().toUpperCase()
    })
    hasGroup.value = true
    showJoinDialog.value = false
    joinInviteCode.value = ''
    await fetchMembers()
    Notify.create({
      type: 'positive',
      message: 'Successfully joined group'
    })
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.body?.message || 'Failed to join group'
    })
  } finally {
    loading.value = false
  }
}

const openEditDialog = () => {
  editGroupName.value = group.value?.name || ''
  showEditDialog.value = true
}

const updateGroup = async () => {
  if (!editGroupName.value.trim() || !group.value?._id) return

  loading.value = true
  try {
    group.value = await GroupsService.putApiGroups(group.value._id, {
      name: editGroupName.value.trim()
    })
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

const leaveGroup = async () => {
  if (!group.value?._id) return

  const confirmed = confirm(isAdmin.value && members.value.length > 1
    ? 'As admin, you cannot leave while there are other members. Remove all members first or delete the group.'
    : 'Are you sure you want to leave this group?'
  )

  if (!confirmed) return

  loading.value = true
  try {
    await GroupsService.postApiGroupsLeave(group.value._id)
    group.value = null
    members.value = []
    hasGroup.value = false
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

const deleteGroup = async () => {
  if (!group.value?._id) return

  const confirmed = confirm('Are you sure you want to delete this group? This action cannot be undone.')
  if (!confirmed) return

  loading.value = true
  try {
    await GroupsService.deleteApiGroups(group.value._id)
    group.value = null
    members.value = []
    hasGroup.value = false
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

const kickMember = async (userId: string, userName: string) => {
  if (!group.value?._id) return

  const confirmed = confirm(`Are you sure you want to kick ${userName} from the group?`)
  if (!confirmed) return

  loading.value = true
  try {
    await GroupsService.deleteApiGroupsKick(group.value._id, userId)
    await fetchMembers()
    Notify.create({
      type: 'positive',
      message: `${userName} has been removed from the group`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to kick member'
    })
  } finally {
    loading.value = false
  }
}

const regenerateInviteCode = async () => {
  if (!group.value?._id) return

  const confirmed = confirm('Are you sure you want to regenerate the invite code? The old code will no longer work.')
  if (!confirmed) return

  loading.value = true
  try {
    const result = await GroupsService.postApiGroupsRegenerateInvite(group.value._id)
    if (group.value && result.inviteCode) {
      group.value.inviteCode = result.inviteCode
    }
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
  if (!group.value?._id) return

  const newStatus = !group.value.inviteEnabled
  loading.value = true
  try {
    await GroupsService.postApiGroupsToggleInvite(group.value._id, {
      enabled: newStatus
    })
    if (group.value) {
      group.value.inviteEnabled = newStatus
    }
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
  if (!group.value?.inviteCode) return

  navigator.clipboard.writeText(group.value.inviteCode)
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
    field: (row: GroupMember) => row.isAdmin ? 'Admin' : 'Member',
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
      <div v-if="loading && !group && authStore.isAuthenticated" class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md text-grey-7">Loading...</div>
      </div>

      <!-- No Group State -->
      <div v-else-if="!hasGroup && authStore.isAuthenticated" class="no-group-container">
        <q-card class="no-group-card">
          <q-card-section class="text-center q-pa-xl">
            <q-icon name="group" size="80px" color="grey-5" class="q-mb-md" />
            <h5 class="q-mt-md q-mb-sm">You're not in a group yet</h5>
            <p class="text-grey-7 q-mb-xl">
              Create a new group or join an existing one with an invite code
            </p>

            <div class="row q-gutter-md justify-center">
              <q-btn
                color="primary"
                icon="add"
                label="Create Group"
                size="lg"
                @click="showCreateDialog = true"
              />
              <q-btn
                color="secondary"
                icon="login"
                label="Join Group"
                size="lg"
                outline
                @click="showJoinDialog = true"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Has Group State -->
      <div v-else-if="group && authStore.isAuthenticated">
        <!-- Group Info Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-h5">{{ group.name }}</div>
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
        <q-card>
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
                    :color="props.row.isAdmin ? 'primary' : 'grey-6'"
                    :label="props.row.isAdmin ? 'Admin' : 'Member'"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    v-if="isAdmin && !props.row.isAdmin"
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
      </div>

      <!-- Create Group Dialog -->
      <q-dialog v-model="showCreateDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Create New Group</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="newGroupName"
              outlined
              label="Group Name"
              autofocus
              @keyup.enter="createGroup"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              label="Create"
              color="primary"
              @click="createGroup"
              :disable="!newGroupName.trim() || loading"
              :loading="loading"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Join Group Dialog -->
      <q-dialog v-model="showJoinDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Join Group</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="joinInviteCode"
              outlined
              label="Invite Code"
              autofocus
              @keyup.enter="joinGroup"
              hint="Enter the invite code shared by the group admin"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              label="Join"
              color="primary"
              @click="joinGroup"
              :disable="!joinInviteCode.trim() || loading"
              :loading="loading"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

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
                  {{ group?.inviteCode }}
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
                  :outline="!group?.inviteEnabled"
                  :color="group?.inviteEnabled ? 'positive' : 'negative'"
                  :label="group?.inviteEnabled ? 'Invites Enabled' : 'Invites Disabled'"
                  :icon="group?.inviteEnabled ? 'check_circle' : 'block'"
                  @click="toggleInvite"
                  :loading="loading"
                />
              </div>
              <div class="text-caption text-grey-7">
                {{ group?.inviteEnabled
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
