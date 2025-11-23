import { Page } from '@playwright/test';

/**
 * Wait for loading indicators to disappear
 */
export async function waitForLoading(page: Page, timeout = 10000) {
  try {
    await page.waitForSelector('.q-loading', { state: 'hidden', timeout });
  } catch {
    // Loading indicator might not appear for fast operations
  }
}

/**
 * Wait for a success notification/toast
 */
export async function waitForSuccessNotification(page: Page) {
  await page.waitForSelector('.q-notification--positive, .q-notification[role="alert"]', { timeout: 5000 });
}

/**
 * Wait for an error notification/toast
 */
export async function waitForErrorNotification(page: Page) {
  await page.waitForSelector('.q-notification--negative, .q-notification[role="alert"]', { timeout: 5000 });
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for sync to complete (specific to Spajzka's offline-first pattern)
 */
export async function waitForSync(page: Page) {
  // Wait for any pending API calls to complete
  await page.waitForLoadState('networkidle');

  // Give a small buffer for state updates
  await page.waitForTimeout(500);
}
