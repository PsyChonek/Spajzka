<script setup lang="ts">
import { ref } from 'vue'
import { GroupsService } from '@/api-client'
import { useGroupsStore } from '@/stores/groupsStore'
import { Notify } from 'quasar'

const groupsStore = useGroupsStore()

// Dialog states
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)

// Form fields
const newGroupName = ref('')
const joinInviteCode = ref('')
const loading = ref(false)

const emit = defineEmits<{
  groupCreated: []
  groupJoined: []
}>()

const createGroup = async () => {
  if (!newGroupName.value.trim()) return

  loading.value = true
  try {
    const newGroup = await GroupsService.postApiGroups({
      name: newGroupName.value.trim()
    })
    await groupsStore.fetchGroups()
    if (newGroup._id) {
      await groupsStore.selectGroup(newGroup._id)
    }
    showCreateDialog.value = false
    newGroupName.value = ''
    
    Notify.create({
      type: 'positive',
      message: 'Group created successfully'
    })
    
    emit('groupCreated')
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
    const joinedGroup = await GroupsService.postApiGroupsJoin({
      inviteCode: joinInviteCode.value.trim().toUpperCase()
    })
    await groupsStore.fetchGroups()
    if (joinedGroup._id) {
      await groupsStore.selectGroup(joinedGroup._id)
    }
    showJoinDialog.value = false
    joinInviteCode.value = ''
    
    Notify.create({
      type: 'positive',
      message: 'Successfully joined group'
    })
    
    emit('groupJoined')
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.body?.message || 'Failed to join group'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 q-mb-md">Group Actions</div>
      <div class="text-body2 text-grey-7 q-mb-md">
        Create a new group or join an existing one with an invite code
      </div>
      
      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          icon="add"
          label="Create Group"
          @click="showCreateDialog = true"
          unelevated
        />
        <q-btn
          color="secondary"
          icon="login"
          label="Join Group"
          @click="showJoinDialog = true"
          outline
        />
      </div>
    </q-card-section>

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
            hint="Enter a name for your new group"
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
  </q-card>
</template>
