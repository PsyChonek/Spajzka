<script setup lang="ts">
import { computed } from 'vue'
import { useGroupsStore } from '@/stores/groupsStore'

interface Props {
  variant?: 'toolbar' | 'drawer'
}

withDefaults(defineProps<Props>(), {
  variant: 'toolbar'
})

const groupsStore = useGroupsStore()

const handleGroupChange = (groupId: string) => {  
  if (!groupId) {
    console.error('groupId is null or undefined!')
    return
  }

  groupsStore.selectGroup(groupId)
}

// Computed property to truncate group name
const truncatedGroupName = computed(() => {
  const name = groupsStore.currentGroup?.name || 'Select Group'
  const maxLength = 15
  if (name.length > maxLength) {
    return name.substring(0, maxLength) + '...'
  }
  return name
})
</script>

<template>
  <!-- Toolbar Variant (for desktop header) -->
  <div 
    v-if="variant === 'toolbar'" 
    class="q-mx-md gt-xs group-selector-toolbar"
  >
    <q-select
      v-if="groupsStore.groups.length > 0"
      :model-value="groupsStore.currentGroupId"
      :options="groupsStore.sortedGroups"
      option-value="_id"
      option-label="name"
      emit-value
      map-options
      standout="bg-white text-primary"
      dark
      dense
      :loading="groupsStore.loading"
      @update:model-value="handleGroupChange"
      behavior="menu"
      class="group-selector-select"
      :display-value="truncatedGroupName"
    >
      <template v-slot:prepend>
        <q-icon name="group" color="white" />
      </template>
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            No groups available
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <div v-else class="text-white text-caption">
      Loading groups...
    </div>
  </div>

  <!-- Drawer Variant (for mobile drawer) -->
  <q-item v-else-if="variant === 'drawer' && groupsStore.groups.length > 0">
    <q-item-section>
      <q-select
        :model-value="groupsStore.currentGroupId"
        :options="groupsStore.sortedGroups"
        option-value="_id"
        option-label="name"
        emit-value
        map-options
        outlined
        dense
        :loading="groupsStore.loading"
        @update:model-value="handleGroupChange"
        label="Current Group"
        :display-value="truncatedGroupName"
      >
        <template v-slot:prepend>
          <q-icon name="group" />
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No groups available
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.group-selector-toolbar {
  width: 200px;
  max-width: 200px;
  min-width: 150px;
  overflow: hidden;
}

/* Set explicit width on the select component */
.group-selector-select {
  width: 100%;
  max-width: 100%;
}

.group-selector-select :deep(.q-field__control) {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

.group-selector-select :deep(.q-field__native) {
  overflow: hidden !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

/* Truncate the selected group text */
.selected-group-text {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  display: block !important;
}

/* Control the inner container width */
.group-selector-select :deep(.q-field__control-container) {
  overflow: hidden !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

/* Ensure the selected slot container doesn't overflow */
.group-selector-select :deep(.q-field__native > span) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: block !important;
  max-width: 100% !important;
}

/* Target the actual content area */
.group-selector-select :deep(.q-field__inner) {
  overflow: hidden !important;
  max-width: 100% !important;
}
</style>
