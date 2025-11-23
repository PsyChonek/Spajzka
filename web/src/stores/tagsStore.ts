import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TagsService, type Tag } from '@/api-client'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const lastSynced = ref<Date | null>(null)

  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  async function fetchTags() {
    loading.value = true
    try {
      tags.value = await TagsService.getApiTags()
      lastSynced.value = new Date()
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createTag(data: { name: string; color?: string; icon?: string }) {
    loading.value = true
    try {
      const newTag = await TagsService.postApiTags({
        name: data.name,
        color: data.color || '#6200EA',
        icon: data.icon
      })
      tags.value.push(newTag)
      return newTag
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateTag(id: string, data: { name?: string; color?: string; icon?: string }) {
    loading.value = true
    try {
      const updatedTag = await TagsService.putApiTags(id, data as any)
      const index = tags.value.findIndex((t: Tag) => t._id === id)
      if (index !== -1) {
        tags.value[index] = updatedTag
      }
      return updatedTag
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteTag(id: string) {
    loading.value = true
    try {
      await TagsService.deleteApiTags(id)
      const index = tags.value.findIndex((t: Tag) => t._id === id)
      if (index !== -1) {
        tags.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function getTagById(id: string) {
    return tags.value.find((t: Tag) => t._id === id)
  }

  function getTagsByIds(ids: string[]) {
    return tags.value.filter((t: Tag) => ids.includes(t._id!))
  }

  return {
    tags,
    loading,
    lastSynced,
    sortedTags,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds
  }
})
