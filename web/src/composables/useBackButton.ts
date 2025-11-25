import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Composable to handle back button behavior on mobile devices.
 * When a dialog is open, the back button should close the dialog
 * instead of navigating to the previous page.
 *
 * However, if there are any open dropdowns/menus within the dialog,
 * the back button should close those first.
 */
export function useBackButton(isDialogOpen: () => boolean, closeDialog: () => void) {
  const hasAddedHistoryEntry = ref(false)

  /**
   * Check if there are any open Quasar menus/dropdowns in the DOM
   */
  const hasOpenMenus = (): boolean => {
    // Check for Quasar menus and dialogs that are open
    const quasarMenus = document.querySelectorAll('.q-menu:not(.q-menu--hidden)')
    const quasarSelects = document.querySelectorAll('.q-select__dialog')
    const quasarDatePickers = document.querySelectorAll('.q-date__popup')
    const quasarColorPickers = document.querySelectorAll('.q-color-picker')
    const quasarPopups = document.querySelectorAll('.q-popup-edit')

    return (
      quasarMenus.length > 0 ||
      quasarSelects.length > 0 ||
      quasarDatePickers.length > 0 ||
      quasarColorPickers.length > 0 ||
      quasarPopups.length > 0
    )
  }

  const handlePopState = () => {
    if (isDialogOpen()) {
      // Check if there are any open menus/dropdowns
      if (hasOpenMenus()) {
        // Let Quasar handle closing the menus naturally
        // The browser's back action will trigger Quasar's internal menu close handlers
        // We just need to push state back to keep user on the same page
        if (hasAddedHistoryEntry.value) {
          window.history.pushState(null, '', window.location.href)
        }
      } else {
        // No open menus, close the dialog instead of navigating
        closeDialog()

        // Push state back to keep user on the same page
        if (hasAddedHistoryEntry.value) {
          window.history.pushState(null, '', window.location.href)
        }
      }
    }
  }

  const pushHistoryState = () => {
    if (isDialogOpen() && !hasAddedHistoryEntry.value) {
      // Add a history entry when dialog opens
      window.history.pushState(null, '', window.location.href)
      hasAddedHistoryEntry.value = true
    }
  }

  const removeHistoryState = () => {
    if (hasAddedHistoryEntry.value && isDialogOpen()) {
      // Remove the history entry when dialog closes normally (not via back button)
      hasAddedHistoryEntry.value = false
      window.history.back()
    } else if (hasAddedHistoryEntry.value) {
      // Dialog was closed via back button, just reset the flag
      hasAddedHistoryEntry.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)

    // Clean up if dialog is still open when component unmounts
    if (hasAddedHistoryEntry.value && isDialogOpen()) {
      hasAddedHistoryEntry.value = false
      // Don't call history.back() on unmount as it might interfere with normal navigation
    }
  })

  return {
    pushHistoryState,
    removeHistoryState
  }
}
